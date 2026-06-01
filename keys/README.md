# Clés JWT

Les fichiers `jwt-private.pem` et `jwt-public.pem` ne sont **pas** versionnés.

Génération (depuis la racine du dépôt) :

```bash
./scripts/generate-jwt-keys.sh
```

- **jwt-private.pem** : service `huitparfait-auth` uniquement (`JWT_PRIVATE_KEY_PATH`)
- **jwt-public.pem** : services `huitparfait-auth` et `huitparfait-api` (`JWT_PUBLIC_KEY_PATH`)

En production (Railway, etc.), préférer les variables d'environnement :

- `JWT_PUBLIC_KEY` : service **api** et **web**
- `JWT_PRIVATE_KEY` : service **web** uniquement

Les retours ligne peuvent être écrits comme `\n` dans l'UI Railway. Sinon, monter les fichiers PEM via volumes (Docker classique).

Voir `deploy/railway/DEPLOY.adoc`.

Si ce dépôt a déjà exposé d'anciennes clés, régénérez une nouvelle paire et considérez les anciens JWT comme compromis.
