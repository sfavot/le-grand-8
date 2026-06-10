# Le Grand 8 : commandes locales
# Usage : make help

.DEFAULT_GOAL := help

COMPOSE        ?= docker compose
COMPOSE_FILES  := -f docker-compose.yml -f docker-compose-local.yml
COMPOSE_ENV    := -f docker-compose-envlocal.yml

API_DIR        := huitparfait-api
AUTH_DIR       := huitparfait-auth
FRONT_DIR      := huitparfait-front

APP_URL        := http://localhost:3000
NEO4J_BROWSER  := http://localhost:7474
NEO4J_PASSWORD ?= huitparfait-local

.PHONY: help setup keys env-local install neo4j-up neo4j-down neo4j-logs \
        dev dev-api dev-auth dev-front dev-kill stop lint test audit ci \
        compose-up compose-down data-wc2026-generate data-wc2026 \
        data-reset-neo4j data-import-wc2026 data-import-wc2026-knockout data-fresh-wc2026 data-dev-scenario flags-wc2026

help: ## Affiche cette aide
	@echo "Le Grand 8 : commandes locales"
	@echo ""
	@echo "  URL de l'app (via auth) : $(APP_URL)"
	@echo "  Neo4j Browser           : $(NEO4J_BROWSER)"
	@echo ""
	@echo "  Config : .env (versionné) + .env.local (secrets, non versionné)"
	@echo ""
	@echo "  Déploiement : deploy/railway/DEPLOY.adoc"
	@echo ""
	@grep -E '^[a-zA-Z0-9_-]+:.*##' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

setup: keys env-local install ## Première install (clés JWT, .env.local, npm)
	@echo ""
	@echo "Ensuite :"
	@echo "  1. Éditer .env.local (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, secrets)"
	@echo "  2. make neo4j-up   (obligatoire avant make dev)"
	@echo "  3. make data-fresh-wc2026"
	@echo "  4. make flags-wc2026 (drapeaux front)"
	@echo "  5. make dev   (ou make dev-api / dev-auth / dev-front dans 3 terminaux)"
	@echo "  6. Ouvrir $(APP_URL)"

env-local: ## Crée .env.local depuis .env.local.example si absent
	@test -f .env.local \
		|| (cp .env.local.example .env.local && echo "Créé .env.local : à compléter avec tes secrets")
	@test -f .env || (echo "Erreur : .env manquant" && exit 1)

keys: ## Génère les clés JWT (keys/*.pem)
	@chmod +x scripts/generate-jwt-keys.sh
	@if [ -f keys/jwt-private.pem ] && [ -f keys/jwt-public.pem ]; then \
		echo "Clés JWT déjà présentes (make keys-force pour régénérer)"; \
	else \
		./scripts/generate-jwt-keys.sh; \
	fi

keys-force: ## Régénère les clés JWT (écrase l'existant)
	@chmod +x scripts/generate-jwt-keys.sh
	@./scripts/generate-jwt-keys.sh

install: ## npm install (racine + api, auth, front)
	npm install
	cd $(API_DIR) && npm install
	cd $(AUTH_DIR) && npm install
	cd $(FRONT_DIR) && npm install

neo4j-up: ## Démarre Neo4j en arrière-plan (port 7474)
	$(COMPOSE) $(COMPOSE_FILES) up -d huitparfait-data
	@echo "Neo4j : $(NEO4J_BROWSER) (utilisateur neo4j, mot de passe dans .env NEO4J_PASSWORD)"

neo4j-down: ## Arrête Neo4j
	$(COMPOSE) $(COMPOSE_FILES) stop huitparfait-data

neo4j-logs: ## Logs du conteneur Neo4j
	$(COMPOSE) $(COMPOSE_FILES) logs -f huitparfait-data

dev: ## Lance api + auth + front en parallèle (logs mélangés)
	@test -f .env.local || (echo "Fichier .env.local manquant : lance : make env-local" && exit 1)
	@echo "Application : $(APP_URL)"
	@echo "Neo4j seul en Docker (make neo4j-up). Ne pas lancer compose-up : le port 3000 serait pris par Traefik."
	$(MAKE) -j3 dev-api dev-auth dev-front

dev-kill: ## Libère les ports 3000 / 3100 / 8081 (ancien make dev)
	-@lsof -ti :3000 | xargs kill 2>/dev/null || true
	-@lsof -ti :3100 | xargs kill 2>/dev/null || true
	-@lsof -ti :8081 | xargs kill 2>/dev/null || true
	@echo "Ports 3000, 3100, 8081 libérés (si des processus les utilisaient)."

stop: ## Arrête tout (dev local + conteneurs Docker)
	$(MAKE) dev-kill
	-$(COMPOSE) $(COMPOSE_FILES) $(COMPOSE_ENV) down
	-$(COMPOSE) $(COMPOSE_FILES) down
	@echo "Tout arrêté (dev + Docker)."

dev-api: ## API seule (port 3100)
	cd $(API_DIR) && npm run dev

dev-auth: ## Auth + proxy (port 3000) : point d'entrée navigateur
	cd $(AUTH_DIR) && npm run dev

dev-front: ## Front seul (port 8081, webpack dev server)
	cd $(FRONT_DIR) && npm run dev

lint: ## ESLint sur api et auth
	cd $(API_DIR) && npm run lint
	cd $(AUTH_DIR) && npm run lint

test: ## Tests unitaires API (calculatePoints, ranking)
	cd $(API_DIR) && npm test

audit: ## npm audit (api + auth + racine, échoue si vulnérabilité high+)
	npm audit --audit-level=high
	cd $(API_DIR) && npm audit --audit-level=high
	cd $(AUTH_DIR) && npm audit --audit-level=high

ci: lint test ## Lint + tests (comme GitHub Actions)
	@echo "CI locale OK"

compose-up: ## Stack complète via Docker (Traefik sur :3000)
	@test -f .env.local || (echo "Fichier .env.local manquant : lance : make env-local" && exit 1)
	$(COMPOSE) $(COMPOSE_FILES) $(COMPOSE_ENV) up

compose-down: ## Arrête la stack Docker locale
	$(COMPOSE) $(COMPOSE_FILES) $(COMPOSE_ENV) down

data-wc2026-generate: ## Régénère init-data-2026wc.cql depuis les JSON wc2026-*
	node scripts/generate-wc2026-cql.mjs

data-wc2026: data-wc2026-generate ## Alias : génère le seed CDM 2026

data-reset-neo4j: ## Vide toute la base Neo4j locale
	@$(COMPOSE) $(COMPOSE_FILES) ps -q huitparfait-data | grep -q . \
		|| (echo "Neo4j ne tourne pas : lance : make neo4j-up" && exit 1)
	@echo "Suppression de tous les nœuds…"
	@$(COMPOSE) $(COMPOSE_FILES) exec -T huitparfait-data \
		cypher-shell -u neo4j -p '$(NEO4J_PASSWORD)' \
		"MATCH (n) DETACH DELETE n;"

data-import-wc2026: ## Importe init-data-2026wc.cql (make neo4j-up avant)
	@test -f huitparfait-data/init-data-2026wc.cql \
		|| (echo "Fichier manquant : lance : make data-wc2026-generate" && exit 1)
	@$(COMPOSE) $(COMPOSE_FILES) ps -q huitparfait-data | grep -q . \
		|| (echo "Neo4j ne tourne pas : lance : make neo4j-up" && exit 1)
	@echo "Import CDM 2026 dans Neo4j (quelques secondes)…"
	$(COMPOSE) $(COMPOSE_FILES) exec -T huitparfait-data \
		cypher-shell -u neo4j -p '$(NEO4J_PASSWORD)' \
		< huitparfait-data/init-data-2026wc.cql
	@echo "Vérification (attendu : 104 matchs) :"
	@count=$$($(COMPOSE) $(COMPOSE_FILES) exec -T huitparfait-data \
		cypher-shell -u neo4j -p '$(NEO4J_PASSWORD)' \
		"MATCH (g:Game) RETURN count(g);" 2>/dev/null | tail -1 | tr -d '[:space:]'); \
	echo "matchs: $$count"; \
	if [ "$$count" != "104" ]; then \
		echo "ERREUR : $$count matchs au lieu de 104 : lance : make data-fresh-wc2026"; \
		exit 1; \
	fi

data-import-wc2026-knockout: ## Ajoute matchs 73–104 sans effacer users/pronos
	node scripts/import-wc2026-knockout.mjs

data-fresh-wc2026: data-reset-neo4j data-import-wc2026 ## Base vide + import CDM 2026 (efface tout)

data-dev-scenario: ## Scénario de test local (USER_EMAIL=…, option CALCULATE=--calculate)
	@test -n "$(USER_EMAIL)" || (echo "USER_EMAIL requis, ex. : make data-dev-scenario USER_EMAIL=toi@gmail.com" && exit 1)
	@$(COMPOSE) $(COMPOSE_FILES) ps -q huitparfait-data | grep -q . \
		|| (echo "Neo4j ne tourne pas : lance : make neo4j-up" && exit 1)
	node scripts/seed-dev-scenario.mjs --email "$(USER_EMAIL)" $(CALCULATE)

flags-wc2026: ## Copie les drapeaux SVG (flag-icons) pour le front
	npm install
	node scripts/sync-wc2026-flags.mjs
	@test -f huitparfait-front/static/flags/unknown.svg \
		|| cp huitparfait-front/src/assets/unknown-team.svg huitparfait-front/static/flags/unknown.svg
