# ============================================
# Dockerfile - QuickCommerce Monolithe
# ============================================
# Image pour déploiement production-like

# Étape 1 : Image de base Node.js
FROM node:18-alpine

# Métadonnées
LABEL maintainer="Cours Architecture SI"
LABEL version="1.0"
LABEL description="QuickCommerce - Application monolithique (Séance 1)"

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances de production uniquement
RUN npm ci --only=production && \
    npm cache clean --force

# Copier le code source
COPY --chown=nodejs:nodejs . .

# Changer vers l'utilisateur non-root
USER nodejs

# Exposer le port de l'application
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Commande de démarrage
CMD ["node", "src/index.js"]
