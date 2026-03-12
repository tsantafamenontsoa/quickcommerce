// ============================================
// Configuration Base de Données MySQL
// ============================================
// SPOF #4 et #5 : Une seule BDD, pas de réplication

const mysql = require('mysql2/promise');
require('dotenv').config();

// Pool de connexions MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'monolithe2024',
  database: process.env.DB_NAME || 'quickcommerce',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test de connexion au démarrage
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connexion MySQL réussie');
    connection.release();
  } catch (error) {
    console.error('❌ Erreur connexion MySQL:', error.message);
    process.exit(1); // Crash complet si BDD inaccessible (SPOF)
  }
}

// Fonction helper pour exécuter des requêtes
async function query(sql, params) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Erreur requête SQL:', error.message);
    throw error;
  }
}

// Fonction helper pour les transactions
async function transaction(callback) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  
  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  query,
  transaction,
  testConnection
};
