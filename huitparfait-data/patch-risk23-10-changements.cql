// Mise à jour risquette n°23 : 5 remplacements par équipe (CDM 2022/2026) → 10 changements au total.
// À exécuter sur une base déjà importée (Neo4j Browser ou cypher-shell).
MATCH (r:Risk { id: "B10LH8sE87" })
SET r.text = "Les 10 changements sont effectués"
RETURN r.id, r.text;
