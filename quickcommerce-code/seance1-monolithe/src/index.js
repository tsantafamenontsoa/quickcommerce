// ============================================
// QuickCommerce - Application Monolithique
// Séance 1 : Architecture avec 5 SPOF
// ============================================

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const db = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Routes
const productsRouter = require('./routes/products');
const cartRouter = require('./routes/cart');
const ordersRouter = require('./routes/orders');
const paymentsRouter = require('./routes/payments');
const usersRouter = require('./routes/users');

// ============================================
// CONFIGURATION
// ============================================

const app = express();
const PORT = process.env.PORT || 3000;
const ENV = process.env.NODE_ENV || 'development';

// ============================================
// MIDDLEWARE
// ============================================

// CORS
app.use(cors());

// Body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Logger simple
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'QuickCommerce Monolithe',
    environment: ENV,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/products', productsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/users', usersRouter);

// Route racine
app.get('/', (req, res) => {
  res.json({
    message: 'QuickCommerce API - Séance 1 : Monolithe',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      products: '/api/products',
      cart: '/api/cart/:userId',
      orders: '/api/orders',
      payments: '/api/payments',
      users: '/api/users'
    },
    spof: [
      '1. Serveur application unique (pas de réplication)',
      '2. Pas de load balancer',
      '3. Pas d\'auto-scaling',
      '4. Base de données unique (pas de réplication)',
      '5. Pas de backup automatique'
    ]
  });
});

// ============================================
// GESTION D'ERREURS
// ============================================

// 404
app.use(notFound);

// Erreurs globales
app.use(errorHandler);

// ============================================
// DÉMARRAGE DU SERVEUR
// ============================================

async function startServer() {
  try {
    // Test connexion BDD
    console.log('🔌 Connexion à la base de données...');
    await db.testConnection();

    // Démarrer le serveur
    app.listen(PORT, () => {
      console.log('\n╔════════════════════════════════════════════════╗');
      console.log('║   QuickCommerce - Monolithe (Séance 1)        ║');
      console.log('╚════════════════════════════════════════════════╝\n');
      console.log(`🚀 Serveur démarré sur le port ${PORT}`);
      console.log(`🌍 Environnement: ${ENV}`);
      console.log(`📡 API: http://localhost:${PORT}`);
      console.log(`💓 Health: http://localhost:${PORT}/health`);
      console.log('\n⚠️  ATTENTION: Architecture monolithique avec 5 SPOF !');
      console.log('   - Pas de redondance');
      console.log('   - Pas de load balancer');
      console.log('   - Pas d\'auto-scaling');
      console.log('   - BDD unique sans réplication\n');
    });
  } catch (error) {
    console.error('❌ Erreur au démarrage:', error.message);
    process.exit(1);
  }
}

// Gestion arrêt propre
process.on('SIGTERM', () => {
  console.log('📴 Arrêt du serveur...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📴 Arrêt du serveur...');
  process.exit(0);
});

// ============================================
// LANCEMENT
// ============================================

startServer();

module.exports = app;
