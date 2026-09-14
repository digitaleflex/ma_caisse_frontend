# Ma Caisse — API Contract Baseline

**Date:** 14 septembre 2026
**Status:** BASELINE / MIGRATION SPECIFICATION

## Convention cible

### Success

```json
{
  "success": true,
  "data": {}
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Requête invalide",
    "details": {}
  }
}
```

## Frontend rules

- Utiliser `error.code` pour les branches fonctionnelles.
- Ne pas dépendre d'un texte d'erreur localisé.
- Afficher des états explicites `loading`, `empty`, `error`, `success`.
- Après mutation, invalider ou synchroniser les queries concernées.
- Ne jamais considérer une validation locale comme une garantie métier.

## Legacy

Les réponses historiques du Backend peuvent encore être hétérogènes. Elles ne doivent pas être « corrigées » côté Frontend par des hypothèses silencieuses. Une migration doit être liée à une Feature Contract et à un test d'intégration.

## Priorités

- P0 : erreurs structurées, règles financières/stock, paiement/webhook, crédits.
- P1 : succès uniformes, pagination, dashboard/read models, versioning.
- P2 : OpenAPI complet et optimisations secondaires.
