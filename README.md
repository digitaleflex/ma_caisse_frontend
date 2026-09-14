# Ma Caisse — Frontend

Frontend web de **Ma Caisse**, application de gestion quotidienne pour petits commerces.

## État du repository

- **Repository :** `digitaleflex/ma_caisse_frontend`
- **Branche de référence :** `main`
- **Stack :** React 19 + Vite + TypeScript + Tailwind CSS v4 + shadcn/Radix
- **Data fetching :** TanStack Query
- **Formulaires :** React Hook Form + Zod
- **Runtime attendu :** Node.js >= 22
- **API :** backend séparé `digitaleflex/ma_caisse_backend`

> Ce repository est la surface Frontend. Les règles métier critiques et la persistance restent sous responsabilité Backend/API.

## Développement

```bash
pnpm install
pnpm run check:setup
pnpm dev
```

Commandes principales :

- `pnpm dev` — serveur Vite de développement
- `pnpm build` — build de production
- `pnpm preview` — prévisualisation du build
- `pnpm run check:setup` — vérification de configuration

## Variables d'environnement

Créer `.env.local` à partir de `.env.example`.

- `VITE_API_URL` — URL racine de l'API Backend

Aucun fichier `.env` local ne doit être versionné.

## Architecture fonctionnelle

Les domaines actuellement matérialisés dans l'interface comprennent notamment :

- Authentification / onboarding
- Produits
- Ventes
- Dépenses
- Stock
- Crédits / débiteurs
- Tableau de bord / bilan
- Profil / paramètres
- Abonnement / administration

La présence d'une interface ne signifie pas automatiquement qu'une fonctionnalité est considérée comme **acceptée**. La référence d'exécution est le Feature Inventory et les Feature Contracts du projet.

## Contrat Frontend ↔ Backend

Le Frontend consomme des endpoints REST et doit :

1. utiliser les contrats d'API versionnés du projet ;
2. traiter les erreurs par **code stable** et non par texte affiché ;
3. considérer le Backend comme source de vérité pour les règles métier ;
4. invalider/recharger les données après les mutations ;
5. distinguer les états `loading`, `empty`, `error`, `success`.

La normalisation complète de l'API se fait progressivement par Feature, sans migration globale non testée.

## Workflow de développement

```text
FEATURE INVENTORY
      ↓
FEATURE READY
      ↓
FRONTEND DEV ↔ BACKEND DEV
      ↓
INTEGRATION
      ↓
VALIDATION
      ↓
ACCEPTED
```

Une fonctionnalité n'est pas considérée terminée uniquement parce que son écran existe.

## Documentation

Voir `docs/` pour les contrats, décisions, audits et règles d'intégration.
