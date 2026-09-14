# Ma Caisse — Current State

**Status:** BASELINE — 14 septembre 2026

Ce document décrit l'état technique observable du repository Frontend. Il ne remplace pas le Product Discovery, le PRD ni les Feature Contracts.

## 1. Référentiel

| Élément | Référence |
|---|---|
| Frontend | `digitaleflex/ma_caisse_frontend` |
| Backend | `digitaleflex/ma_caisse_backend` |
| Branche de référence | `main` |
| Runtime | Node.js >= 22 |
| UI | React 19 / Vite / TypeScript / Tailwind v4 / shadcn/Radix |
| API client | TanStack Query + services HTTP |

## 2. Fonctionnalités matérialisées côté Frontend

- AUTH / onboarding
- PRODUITS
- VENTES
- DÉPENSES
- STOCK
- CRÉDITS / DÉBITEURS
- PILOTAGE / BILAN
- PROFIL / PARAMÈTRES
- ABONNEMENT
- ADMINISTRATION

## 3. Règles de lecture

- **Présent UI** ≠ **fonctionnellement accepté**.
- Le Backend reste la source de vérité pour les règles métier, la sécurité et la persistance.
- Les validations locales Frontend servent principalement l'expérience utilisateur et ne remplacent pas la validation serveur.
- Les calculs financiers critiques ne doivent pas dépendre exclusivement du Frontend.

## 4. Gaps d'intégration connus

### API-001 — Formats de succès hétérogènes
Certaines réponses historiques utilisent `{ message, data }`, d'autres `{ message, token, user }` ou `{ success: true, ... }`.

**Action :** normalisation progressive par Feature, sans casser tous les consommateurs simultanément.

### API-002 — Formats d'erreur hétérogènes
Le Frontend peut recevoir `{ message }`, `{ message, error }` ou des structures spécifiques.

**Cible :**

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

### API-003 — Crédit / débiteur
Le Frontend historique utilise des concepts/routes de crédits qui ne sont pas parfaitement alignés avec les routes Backend `debtors` / `repayments`.

**Action :** verrouiller le modèle métier `Customer/Debtor → Credit/Receivable → Repayment` avant migration des routes.

### API-004 — Calculs de pilotage
Une partie des agrégations et du rapprochement des transactions est actuellement reconstruite côté Frontend.

**Cible :** exposer progressivement des read models Backend dédiés au pilotage.

### API-005 — Atomicité stock/vente
Les mutations impliquant vente et stock doivent devenir atomiques.

**Priorité : P0.**

### API-006 — Paiement/webhook
Le flux FedaPay doit être audité et verrouillé sur : idempotence, corrélation utilisateur/plan/montant, replay et attribution des droits.

**Priorité : P0.**

## 5. Workflow de migration

```text
AUDIT
 → BUSINESS DECISION
 → FINAL API CONTRACT
 → FEATURE CONTRACT
 → FRONTEND ↔ BACKEND
 → INTEGRATION
 → VALIDATION
 → ACCEPTED
```

Aucune migration globale de stack ou de routes ne doit être lancée uniquement pour rendre le code « plus propre ».
