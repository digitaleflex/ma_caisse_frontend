# Syntax=docker/dockerfile:1
# =============================================================================
# Stage 1: Builder
# =============================================================================
# Utilisation de Node 22 LTS pour la stabilité
FROM node:22-alpine AS builder

WORKDIR /app

# Active pnpm via Corepack (plus propre que npm i -g)
RUN corepack enable

# Copie des fichiers de dépendances en respectant la structure
# Le projet est plat (pas de sous-dossier frontend)
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY frontend/package.json ./frontend/

# Installation des dépendances
WORKDIR /app/frontend
RUN --mount=type=cache,id=pnpm-store-frontend,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Copie du code source et Build
COPY frontend/ .
RUN pnpm build

# =============================================================================
# Stage 2: Production - Nginx (Plus léger et performant que Node+serve)
# =============================================================================
FROM nginx:alpine AS production

LABEL org.opencontainers.image.title="Ma Caisse Frontend"

# Copie de la config nginx par défaut (optionnel mais recommandé pour les SPA)
# Le nginx.conf existe déjà dans le projet
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier UNIQUEMENT les fichiers statiques générés (dist)
# Chemin corrigé : /app/frontend/dist
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Nginx écoute sur le port 80 par défaut
EXPOSE 80

# Healthcheck natif
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://127.0.0.1:80/ || exit 1

# Nginx démarre automatiquement avec l'image de base, pas besoin de CMD
