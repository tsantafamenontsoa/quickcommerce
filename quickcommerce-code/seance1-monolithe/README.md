# QuickCommerce - Séance 1 : Monolithe

Application monolithique e-commerce avec **5 SPOF (Single Points of Failure)** pour démonstration pédagogique.

---

## 📦 Structure du projet

```
seance1-monolithe/
├── src/
│   ├── index.js                 # Serveur Express principal
│   ├── config/
│   │   └── database.js          # Connexion MySQL
│   ├── routes/
│   │   ├── products.js          # Catalogue produits
│   │   ├── cart.js              # Panier
│   │   ├── orders.js            # Commandes
│   │   ├── payments.js          # Paiements
│   │   └── users.js             # Utilisateurs
│   └── middleware/
│       └── errorHandler.js      # Gestion erreurs
├── sql/
│   └── init.sql                 # Initialisation BDD
├── package.json
├── .env.example
└── README.md
```

---

## 🚀 Installation

### 1. Prérequis

- **Node.js** 18+ ([télécharger](https://nodejs.org/))
- **MySQL** 8.0+ ou Docker

### 2. Installer les dépendances

```bash
cd seance1-monolithe
npm install
```

### 3. Configurer l'environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer .env avec vos paramètres
# Note: Si vous utilisez Docker Compose, le port est 3307
```

Exemple `.env` :
```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=3307
DB_NAME=quickcommerce
DB_USER=root
DB_PASSWORD=monolithe2024
```

### 4. Initialiser la base de données

**Option A : Avec Docker Compose** (recommandé)

```bash
# Depuis le dossier docker-compose
cd ../archi-docker-compose
docker-compose -f docker-compose-seance1-monolithe.yml up -d

# Attendre que MySQL démarre (30 secondes)

# Initialiser les tables
docker exec -i quickcommerce_mysql mysql -u root -pmonolithe2024 < ../quickcommerce-code/seance1-monolithe/sql/init.sql
```

**Option B : Avec MySQL local**

```bash
mysql -u root -p < sql/init.sql
```

### 5. Démarrer l'application

```bash
npm start
# ou pour le mode développement avec redémarrage auto:
npm run dev
```

Le serveur démarre sur **http://localhost:3000**

---

## 📡 API Endpoints

### Health Check
```bash
GET /health
```

### Produits (Catalogue)
```bash
GET    /api/products              # Liste tous les produits
GET    /api/products/:id          # Détails d'un produit
POST   /api/products              # Créer un produit
PUT    /api/products/:id          # Mettre à jour
DELETE /api/products/:id          # Supprimer
```

### Panier
```bash
GET    /api/cart/:userId          # Panier d'un utilisateur
POST   /api/cart                  # Ajouter au panier
PUT    /api/cart/:id              # Modifier quantité
DELETE /api/cart/:id              # Supprimer article
DELETE /api/cart/user/:userId     # Vider le panier
```

### Commandes
```bash
GET    /api/orders                # Liste des commandes
GET    /api/orders/:id            # Détails commande
POST   /api/orders                # Créer une commande
PUT    /api/orders/:id/status     # Modifier statut
DELETE /api/orders/:id            # Annuler commande
```

### Paiements
```bash
GET    /api/payments              # Liste des paiements
GET    /api/payments/:id          # Détails paiement
GET    /api/payments/order/:id    # Paiement d'une commande
POST   /api/payments              # Créer un paiement
PUT    /api/payments/:id/status   # Modifier statut
POST   /api/payments/:id/refund   # Rembourser
```

### Utilisateurs
```bash
GET    /api/users                 # Liste utilisateurs
GET    /api/users/:id             # Détails utilisateur
POST   /api/users                 # Créer utilisateur
PUT    /api/users/:id             # Mettre à jour
DELETE /api/users/:id             # Supprimer
```

---

## 🧪 Tests avec curl

### 1. Health Check
```bash
curl http://localhost:3000/health
```

### 2. Liste des produits
```bash
curl http://localhost:3000/api/products
```

### 3. Panier de l'utilisateur 1
```bash
curl http://localhost:3000/api/cart/1
```

### 4. Ajouter au panier
```bash
curl -X POST http://localhost:3000/api/cart \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "product_id": 2, "quantity": 1}'
```

### 5. Créer une commande
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "shipping_address": "123 Rue Test, Paris"
  }'
```

### 6. Payer une commande
```bash
curl -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": 1,
    "payment_method": "card"
  }'
```

---

## ⚠️ Les 5 SPOF (Single Points of Failure)

### SPOF #1 : Serveur Application Unique
**Problème** : Un seul processus Node.js  
**Conséquence** : Si crash → site inaccessible

**Simulation** :
```bash
# Arrêter le serveur
Ctrl+C

# Test
curl http://localhost:3000/health
# → Connection refused
```

---

### SPOF #2 : Pas de Load Balancer
**Problème** : Pas de répartition de charge  
**Conséquence** : Le serveur unique gère tout le trafic

**Démonstration** :
```bash
# Envoyer 100 requêtes simultanées
for i in {1..100}; do
  curl http://localhost:3000/api/products &
done
wait

# Observer la latence augmenter
```

---

### SPOF #3 : Pas d'Auto-Scaling
**Problème** : Capacité fixe  
**Conséquence** : Crash si pic de charge (Black Friday)

**Simulation** : Voir Simulateur HTML Séance 1

---

### SPOF #4 : Base de Données Unique
**Problème** : Une seule instance MySQL  
**Conséquence** : Si BDD tombe → tout plante

**Simulation avec Docker** :
```bash
# Arrêter MySQL
docker-compose stop quickcommerce_mysql

# Tester l'API
curl http://localhost:3000/api/products
# → Erreur 500
```

---

### SPOF #5 : Pas de Backup/Réplication
**Problème** : Pas de réplication BDD  
**Conséquence** : Perte de données si crash disque

---

## 📊 Données de Test Pré-chargées

L'initialisation SQL charge automatiquement :

- **3 utilisateurs** : alice@example.com, bob@example.com, charlie@example.com
- **10 produits** : Laptop, iPhone, casques, etc.
- **4 articles** dans des paniers
- **3 commandes** avec différents statuts
- **3 paiements** (2 complétés, 1 pending)

---

## 🔄 Workflow Complet

### Scénario : Alice achète un iPhone

```bash
# 1. Alice consulte les produits
curl http://localhost:3000/api/products

# 2. Alice ajoute iPhone (id=2) à son panier
curl -X POST http://localhost:3000/api/cart \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "product_id": 2, "quantity": 1}'

# 3. Alice consulte son panier
curl http://localhost:3000/api/cart/1

# 4. Alice passe commande
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "shipping_address": "123 Rue de la Paix, Paris"}'
# → Retourne order_id: 4

# 5. Alice paie
curl -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -d '{"order_id": 4, "payment_method": "card"}'

# 6. Vérifier la commande
curl http://localhost:3000/api/orders/4
```

---

## 🎓 Exercices Pédagogiques

### Exercice 1 : Simuler un Crash (15 min)

**Objectif** : Démontrer le SPOF #1

1. Démarrer l'application
2. Tester `/health` → OK
3. Arrêter le serveur (Ctrl+C)
4. Tester `/health` → Erreur
5. **Question** : Comment résoudre ce SPOF ?

---

### Exercice 2 : Crash Base de Données (20 min)

**Objectif** : Démontrer le SPOF #4

```bash
# 1. Tester API
curl http://localhost:3000/api/products  # → OK

# 2. Arrêter MySQL
docker-compose stop quickcommerce_mysql

# 3. Tester API
curl http://localhost:3000/api/products  # → Erreur 500

# 4. Redémarrer MySQL
docker-compose start quickcommerce_mysql

# 5. L'API fonctionne à nouveau
curl http://localhost:3000/api/products  # → OK
```

**Question** : Comment garantir la disponibilité de la BDD ?

---

### Exercice 3 : Identifier tous les SPOF (30 min)

Listez **tous les points de défaillance** de cette architecture :

1. Serveur application
2. Base de données
3. Réseau
4. Stockage
5. ?

---

## 🔧 Dépannage

### Erreur : `ECONNREFUSED` lors du démarrage

**Cause** : MySQL n'est pas démarré ou mauvais port

**Solution** :
```bash
# Vérifier que MySQL tourne
docker-compose ps

# Vérifier le port dans .env (3307 si Docker)
cat .env
```

---

### Erreur : `ER_ACCESS_DENIED_ERROR`

**Cause** : Mauvais mot de passe MySQL

**Solution** :
```bash
# Vérifier le mot de passe dans .env
# Doit correspondre au docker-compose.yml
```

---

### Erreur : `Table doesn't exist`

**Cause** : BDD pas initialisée

**Solution** :
```bash
# Réexécuter le script SQL
docker exec -i quickcommerce_mysql mysql -u root -pmonolithe2024 < sql/init.sql
```

---

## 📚 Prochaines Étapes

**Séance 2** : Infrastructure AWS (résoudre les SPOF 1, 2, 3, 4, 5)  
**Séance 3** : Découpage en modules  
**Séance 4** : Patterns architecturaux  
**Séance 5** : Sécurité et RGPD  

---

## 📝 Notes Techniques

- **Framework** : Express.js 4.18
- **BDD** : MySQL 8.0 avec mysql2
- **Pool de connexions** : 10 connexions max
- **Transactions** : Gérées pour commandes/paiements
- **Validation** : Basique (à améliorer en production)
- **Sécurité** : Minimale (mots de passe non hachés !)

---

**⚠️ ATTENTION** : Ce code est pédagogique. **NE PAS utiliser en production** sans :
- Hachage bcrypt des mots de passe
- Authentification JWT
- Validation des entrées
- Rate limiting
- HTTPS/TLS
- Gestion avancée des erreurs

---

**Bon cours ! 🎓**
