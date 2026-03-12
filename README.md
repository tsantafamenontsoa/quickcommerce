# QuickCommerce - Monolithe

Application e-commerce monolithique pour TP Architecture SI.

## Objectif du TP

Installer et faire tourner QuickCommerce, puis **simuler les 5 Single Points of Failure** pour comprendre leurs impacts.

---

## Quick Start

### 1. Cloner le repository

```bash
git clone https://github.com/votre-cours/quickcommerce-tp1.git
cd quickcommerce-tp1
```

### 2. Démarrer l'application

```bash
docker-compose up --build -d
```

**Attendre** : ~2 minutes (build + démarrage MySQL)

### 3. Tester

```bash
# Health check
curl http://localhost:3000/health

# Produits
curl http://localhost:3000/api/products
```

**✅ Si vous voyez 10 produits, c'est bon !**

---

## 📊 Architecture

```
┌──────────────────────────────────┐
│   Docker                         │
├──────────────────────────────────┤
│  📦 quickcommerce_app            │
│  │  Node.js + Express           │
│  │  Port: 3000                  │
│  └─────────────────────────────  │
│                                  │
│  📦 quickcommerce_mysql          │
│  │  MySQL 8.0                   │
│  │  Port: 3306                  │
│  └─────────────────────────────  │
└──────────────────────────────────┘
```

**2 conteneurs** :
- `quickcommerce_app` : API REST Node.js
- `quickcommerce_mysql` : Base de données MySQL

---

## 📚 API Endpoints

### Health
- `GET /health` → `{"status":"OK"}`

### Produits
- `GET /api/products` → Liste des produits
- `GET /api/products/:id` → Détails d'un produit
- `POST /api/products` → Créer un produit
- `PUT /api/products/:id` → Modifier un produit
- `DELETE /api/products/:id` → Supprimer un produit

### Panier
- `GET /api/cart/:userId` → Panier utilisateur
- `POST /api/cart` → Ajouter au panier
- `PUT /api/cart/:id` → Modifier quantité
- `DELETE /api/cart/:id` → Supprimer article

### Commandes
- `GET /api/orders` → Liste des commandes
- `GET /api/orders/:id` → Détails commande
- `POST /api/orders` → Créer commande

### Paiements
- `GET /api/payments` → Liste des paiements
- `POST /api/payments` → Créer paiement

### Utilisateurs
- `GET /api/users` → Liste des utilisateurs
- `POST /api/users` → Créer utilisateur

---

## 🔧 Commandes Utiles

```bash
# Démarrer
docker-compose up -d

# Arrêter
docker-compose stop

# Redémarrer
docker-compose restart

# Voir les logs
docker-compose logs -f

# Voir les conteneurs
docker-compose ps

# Arrêter et supprimer
docker-compose down

# Arrêter un conteneur spécifique
docker stop quickcommerce_app
docker stop quickcommerce_mysql

# Redémarrer un conteneur
docker start quickcommerce_app
docker start quickcommerce_mysql

# Stats temps réel
docker stats

# Backup BDD
docker exec quickcommerce_mysql mysqldump -u root -proot quickcommerce > backup.sql

# Restore BDD
docker exec -i quickcommerce_mysql mysql -u root -proot quickcommerce < backup.sql
```

---

## 🎓 Les 5 SPOF à Simuler

1. **Application unique** → Crash app
2. **Pas de Load Balancer** → Pas de basculement
3. **Pas d'Auto-Scaling** → Surcharge
4. **BDD unique** → Crash MySQL
5. **Pas de backup off-site** → Perte de données

**Objectif** : Les tester, chronométrer, calculer les pertes !

---

## 🚨 Troubleshooting

### Port 3000 déjà utilisé

```bash
# Trouver qui utilise le port
netstat -ano | findstr :3000

# Tuer le processus
taskkill /PID <PID> /F
```

### MySQL ne démarre pas

```bash
# Voir les logs
docker logs quickcommerce_mysql

# Attendre 30-60 secondes (MySQL prend du temps)
```

### "Connection refused"

```bash
# Vérifier que les conteneurs tournent
docker ps

# Redémarrer
docker-compose restart
```

---

## 📦 Stack Technique

- **Backend** : Node.js 18 + Express.js
- **Base de données** : MySQL 8.0
- **Containerisation** : Docker + Docker Compose

---

## 👥 Auteurs

Tsanta Randriatsitohaina

---

## 📄 Licence

Ce projet est à usage pédagogique uniquement.
