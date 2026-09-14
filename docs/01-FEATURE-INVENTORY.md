# Ma Caisse — Feature Inventory Master

**Baseline:** 14 septembre 2026
**Status:** INVENTORY — à affiner par Feature Contract

## Convention

`INVENTORIED → ANALYZING → READY → FRONTEND DEV ↔ BACKEND DEV → INTEGRATION → VALIDATION → ACCEPTED`

`BLOCKED` et `REWORK` sont des états exceptionnels avec cause obligatoire.

## Inventory initial

| ID | Feature | Frontend | Backend | Intégration | Priorité | État |
|---|---|---|---|---|---|---|
| F-001 | Authentification & accès | Présent | Présent | Partielle/à verrouiller | P0 | ANALYZING |
| F-002 | Onboarding / profil commerce | Présent | Présent | À confirmer | P0 | ANALYZING |
| F-003 | Produits | Présent | Présent | Oui, contrat à normaliser | P0 | ANALYZING |
| F-004 | Vente | Présent | Présent | Oui, règles stock à renforcer | P0 | ANALYZING |
| F-005 | Encaissement / paiement de vente | À distinguer | À distinguer | Non verrouillé | P0 | INVENTORIED |
| F-006 | Clients / crédits | Présent | Debtors + repayments | Contrat métier à verrouiller | P0 | ANALYZING |
| F-007 | Stock / mouvements | Présent | Couplé aux produits/ventes | Atomicité à renforcer | P0 | ANALYZING |
| F-008 | Dépenses | Présent | Présent | Oui, contrat à normaliser | P0 | ANALYZING |
| F-009 | Pilotage / bilan | Présent | Données disponibles | Calculs encore partiellement Frontend | P1 | ANALYZING |
| F-010 | Abonnement plateforme | Présent | Présent | À sécuriser | P1 | ANALYZING |
| F-011 | Administration | Présent | Présent | À confronter au périmètre MVP | P1 | INVENTORIED |
| F-012 | Feedback / support | Présent | Présent | À confirmer | P2 | INVENTORIED |
| F-013 | Offline métier | PWA partielle | — | Non | P2 | INVENTORIED |

## Dépendances critiques

```text
F-001 Auth
  └── F-002 Commerce
       ├── F-003 Produits
       │    └── F-007 Stock
       │         └── F-004 Vente
       ├── F-008 Dépenses
       └── F-006 Clients/Crédits

F-010 Abonnement → limites métier → F-004/F-008/F-006/F-003

F-009 Pilotage ← F-003 + F-004 + F-006 + F-007 + F-008
```

## Règles

- Une feature est une capacité métier cohérente, pas un écran ou un endpoint isolé.
- Une feature ne passe à `READY` qu'avec objectif, scope, dépendances, responsabilités FE/BE, données, contrat API et critères d'acceptation.
- Une feature n'est `ACCEPTED` qu'après intégration et validation.
- Toute modification d'une feature acceptée passe par une Change Request et une analyse d'impact.
