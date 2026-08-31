# syntax=docker/dockerfile:1

# =============================================================================
# Stage 1: Builder
# =============================================================================
# Utilisation de Node 22 LTS pour la stabilité
FROM node:22-alpine AS builder

WORKDIR /app

# Active pnpm via Corepack (plus propre que npm i -g)
RUN corepack enable

# 1. Copie des fichiers de dépendances en respectant la structure
# On suppose que tu lances le build depuis la racine du repo
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY frontend/package.json ./frontend/

# 2. Installation des dépendances
WORKDIR /app/frontend
# Si c'est un monorepo, on pourrait avoir besoin du pnpm-workspace.yaml
# --frozen-lockfile est strict : si ça échoue, on veut que le build plante !
RUN --mount=type=cache,id=pnpm-store-frontend,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# 3. Copie du code source et Build
COPY frontend/ .
RUN pnpm build

# =============================================================================
# Stage 2: Production - Nginx (Plus léger et performant que Node+serve)
# =============================================================================
FROM nginx:alpine AS production

LABEL org.opencontainers.image.title="Ma Caisse Frontend"

# Copie de la config nginx par défaut (optionnel mais recommandé pour les SPA)
# Il faudrait créer un fichier nginx.conf basique pour gérer le fallback index.html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copier UNIQUEMENT les fichiers statiques générés (dist)
# Note le chemin : /app/frontend/dist car on a changé le WORKDIR plus haut
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Nginx écoute sur le port 80 par défaut
EXPOSE 80

# Healthcheck natif
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://127.0.0.1:80/ || exit 1

# Nginx démarre automatiquement avec l'image de base, pas besoin de CMD