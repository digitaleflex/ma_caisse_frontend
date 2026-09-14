# Ma Caisse — API Contract

**Version:** 1.1-harmonized  
**Status:** WORKING CONTRACT — implementation baseline  
**Source of truth:** `Ma_Caisse_API_Contract_Frontend_Backend_v1.1_HARMONISE.docx`  
**Owners:** Eurin (Frontend) · Aristide (Backend)

> Ce document est le contrat partagé entre les deux repositories. Il ne remplace pas les décisions produit. Toute modification breaking doit être documentée avant implémentation.

## 1. Principes

- API REST + JSON.
- Les nouveaux endpoints utilisent `/api/v1/...`.
- Les anciennes routes peuvent être conservées temporairement, mais leur statut doit être explicite.
- Les noms de ressources et champs sont stables entre Frontend, Backend et documentation.
- Les dates utilisent ISO 8601.
- Les montants utilisent une unité monétaire unique définie par le contrat métier.
- Les données d'autorité métier viennent du Backend.
- L'UI ne constitue jamais une frontière de sécurité.
- Les permissions sont contrôlées côté API.
- Les mutations sensibles doivent être idempotentes lorsque nécessaire.

## 2. Vocabulaire canonique

| Concept | Ressource API canonique | Règle |
|---|---|---|
| Produit | `products` | Canonique |
| Vente | `sales` | Canonique |
| Dépense | `expenses` | Canonique |
| Débiteur / crédit client | `debtors` | Canonique pour l'existant |
| Remboursement | `repayments` | À distinguer des paiements PSP |
| Abonnement | `subscription` | Canonique |
| Paiement d'abonnement | `payments` / FedaPay | À distinguer d'un remboursement client |
| Administration | `admin` | Canonique |
| Feedback | `feedback` | Canonique |

### Règle `credits` / `debtors`

L'ambiguïté historique entre `credits` et `debtors` est supprimée pour les nouveaux contrats. Le domaine existant est exposé sous `debtors` + `repayments`, sauf décision explicite de migration.

## 3. Format de réponse

### Succès objet

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

### Succès liste

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0
  }
}
```

### Erreur

```json
{
  "success": false,
  "error": {
    "code": "BUSINESS_ERROR",
    "message": "Message lisible",
    "fields": {}
  }
}
```

Les codes doivent être stables. Le Frontend doit pouvoir distinguer au minimum : validation, authentification, autorisation, conflit métier, ressource absente, limite d'abonnement et erreur réseau/serveur.

## 4. Règles Request

- Ne jamais faire confiance à `userId`, rôle, statut calculé ou autres champs contrôlés par le serveur.
- Les IDs sont transmis comme identifiants de ressources.
- Les enums acceptées sont celles du contrat uniquement.
- Les champs sensibles ou internes sont refusés côté Backend.
- Les validations Frontend améliorent l'UX ; les validations Backend restent obligatoires.

## 5. P0 — Contrats à verrouiller

### AUTH

Couvre inscription, connexion, session, OTP, mot de passe, récupération et autorisation.

### PRODUCTS

CRUD produits et données nécessaires au stock.

### SALES

Création/modification/suppression d'une vente et cohérence du stock.

**Règle critique:** vente + mutation du stock doivent être atomiques côté Backend.

### DEBTORS + REPAYMENTS

Gestion des débiteurs, solde, remboursements et historique.

**Règle critique:** un remboursement ne peut jamais rendre le solde négatif.

### PAYMENTS + SUBSCRIPTION

Création/vérification des paiements, webhooks et activation d'abonnement.

**Règles critiques:**
- le prix/plan autorisé est déterminé côté serveur ;
- un webhook rejoué ne doit pas doubler une activation ;
- une transaction FedaPay doit être corrélée à l'utilisateur ;
- un paiement échoué/annulé/expiré ne donne aucun droit payant ;
- le statut serveur est l'autorité pour l'accès payant.

### ADMIN

Toutes les opérations administratives doivent être protégées côté Backend par une autorisation serveur.

## 6. P1 — Harmonisation Frontend

Après chaque mutation, le Frontend invalide ou rafraîchit les queries concernées :

| Mutation | Données à synchroniser |
|---|---|
| Produit | produits, stock, indicateurs concernés |
| Vente | ventes, stock, dashboard, transactions |
| Dépense | dépenses, dashboard, transactions |
| Débiteur | crédits/débiteurs, indicateurs concernés |
| Remboursement | remboursements, solde débiteur |
| Abonnement | statut abonnement, accès |

Les états UI doivent être déterministes : loading, success, empty, validation error, business error, auth error, network error.

## 7. Stock faible

`lowStockThreshold` possède une seule source de vérité. La valeur codée en dur dans l'interface ne doit pas concurrencer le paramètre utilisateur/serveur.

## 8. Dashboard et transactions

Les calculs métier critiques doivent être centralisés côté Backend. Le Frontend affiche et formate les indicateurs reçus.

Si une agrégation reste temporairement côté Frontend, elle doit être explicitement documentée comme solution transitoire.

## 9. Idempotence

Les mutations sensibles et les futures synchronisations offline doivent pouvoir utiliser une clé d'idempotence (`Idempotency-Key`) lorsque le scénario l'exige.

## 10. Offline / PWA

La présence du plugin PWA ne signifie pas que le métier offline est terminé. Le statut OFFLINE reste non terminé tant que ne sont pas définis et implémentés : stockage local, queue de synchronisation, reprise réseau, idempotence et résolution des conflits.

## 11. Sécurité

- `BYPASS_OTP` est strictement réservé aux environnements de test.
- Aucun secret ou détail interne dans les réponses API.
- Pas de stack trace exposée au client.
- Les hashes et données sensibles ne sont jamais renvoyés inutilement.
- Helmet, CORS, rate limiting, JWT/session et contrôles d'autorisation restent côté Backend.

## 12. Versioning et changements

Un changement breaking nécessite :

1. identification de l'impact ;
2. mise à jour du présent contrat ;
3. mise à jour des types Frontend ;
4. mise à jour du Backend ;
5. tests d'intégration ;
6. validation par les deux responsables.

Aucun changement breaking silencieux entre les deux repositories.

## 13. Definition of Ready — Feature

Une Feature est READY lorsque :

- objectif clair ;
- périmètre clair ;
- dépendances identifiées ;
- responsabilités Frontend/Backend définies ;
- données nécessaires identifiées ;
- règles métier critiques définies ;
- contrat API suffisant ;
- critères d'acceptation définis.

## 14. Definition of Done — Feature

Une Feature est DONE lorsque :

- Frontend terminé ;
- Backend terminé ;
- intégration fonctionnelle ;
- happy path validé ;
- erreurs majeures gérées ;
- règles métier critiques respectées ;
- critères d'acceptation validés ;
- tests essentiels passants ;
- aucun bug bloquant connu.

## 15. Statuts Feature

`INVENTORIED → ANALYZING → READY → FRONTEND DEV / BACKEND DEV → INTEGRATION → VALIDATION → ACCEPTED`

Exceptions : `BLOCKED` avec raison et `REWORK` avec raison.

Une Feature ACCEPTED ne doit pas être modifiée silencieusement. Toute évolution significative passe par une Change Request et une analyse d'impact.

## 16. Matrice de correction P0

| ID | Correction | Priorité |
|---|---|---|
| API-001 | Versionner les nouveaux endpoints en `/api/v1` | P0 |
| API-003 | Supprimer l'ambiguïté `credits` / `debtors` | P0 |
| API-004 | Rendre vente + stock atomiques | P0 |
| API-005 | Empêcher les soldes débiteurs négatifs | P0 |
| API-009 | Sécuriser et rendre idempotents les webhooks FedaPay | P0 |
| API-010 | Faire du statut serveur l'autorité abonnement | P0 |
| API-011 | Déterminer plan/prix côté serveur | P0 |
| API-012 | Bloquer `BYPASS_OTP` en production | P0 |
| API-018 | Contrôler toutes les permissions côté API | P0 |

## 17. Gouvernance

Ce fichier est la copie opérationnelle du contrat partagé. La version Word reste la **version documentaire originale de référence**. Les corrections futures doivent être reportées dans les deux représentations afin d'éviter une divergence documentaire.

**Dernière version harmonisée : 1.1**
