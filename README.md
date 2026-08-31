# Frontend (Vite + React)

## Scripts
- `pnpm dev` : démarre le serveur de dev Vite (port 5173)
- `pnpm build` : build de production
- `pnpm preview` : prévisualisation du build (port 5173)
 - `pnpm run check:setup` : vérifie les dépendances et fichiers requis

## Démarrage local
```bash
pnpm install
pnpm run check:setup
pnpm dev
```

## Variables d’environnement
- `VITE_API_URL` : URL de l’API (ex: `http://localhost:4000`)

## Docker
Build et run via Docker Compose depuis la racine:
```bash
docker compose up --build
```
Le service expose le port 5173.

## Structure principale
- `src/` : point d’entrée (`main.tsx`, `App.tsx`)
- `components/` : composants UI
- `styles/` : styles globaux
- `lib/` : utilitaires
