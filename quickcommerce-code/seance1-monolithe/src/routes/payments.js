// ============================================
// Routes : PAIEMENTS
// ============================================

const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/payments - Liste tous les paiements
router.get('/', async (req, res, next) => {
  try {
    const status = req.query.status;

    let sql = `
      SELECT 
        p.*,
        o.user_id,
        o.total_amount as order_total
      FROM payments p
      INNER JOIN orders o ON p.order_id = o.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND p.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY p.created_at DESC';

    const payments = await db.query(sql, params);

    res.json({
      success: true,
      data: payments,
      count: payments.length
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/payments/:id - Détails d'un paiement
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const payments = await db.query(
      `SELECT 
        p.*,
        o.user_id,
        o.total_amount as order_total,
        o.status as order_status
       FROM payments p
       INNER JOIN orders o ON p.order_id = o.id
       WHERE p.id = ?`,
      [id]
    );

    if (payments.length === 0) {
      const error = new Error('Paiement non trouvé');
      error.status = 404;
      throw error;
    }

    res.json({
      success: true,
      data: payments[0]
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/payments/order/:orderId - Paiement d'une commande
router.get('/order/:orderId', async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const payments = await db.query(
      'SELECT * FROM payments WHERE order_id = ?',
      [orderId]
    );

    if (payments.length === 0) {
      const error = new Error('Aucun paiement pour cette commande');
      error.status = 404;
      throw error;
    }

    res.json({
      success: true,
      data: payments[0]
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/payments - Créer un paiement
router.post('/', async (req, res, next) => {
  try {
    const { order_id, payment_method } = req.body;

    // Validation
    if (!order_id || !payment_method) {
      const error = new Error('Champs requis: order_id, payment_method');
      error.status = 400;
      throw error;
    }

    const validMethods = ['card', 'paypal', 'bank_transfer'];
    if (!validMethods.includes(payment_method)) {
      const error = new Error(`Méthode de paiement invalide. Valeurs possibles: ${validMethods.join(', ')}`);
      error.status = 400;
      throw error;
    }

    // Vérifier que la commande existe et n'a pas déjà de paiement
    const orders = await db.query(
      'SELECT id, total_amount FROM orders WHERE id = ?',
      [order_id]
    );

    if (orders.length === 0) {
      const error = new Error('Commande non trouvée');
      error.status = 404;
      throw error;
    }

    const existingPayments = await db.query(
      'SELECT id FROM payments WHERE order_id = ?',
      [order_id]
    );

    if (existingPayments.length > 0) {
      const error = new Error('Un paiement existe déjà pour cette commande');
      error.status = 400;
      throw error;
    }

    const amount = orders[0].total_amount;

    // Simuler un traitement de paiement
    const transaction_id = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const status = Math.random() > 0.1 ? 'completed' : 'failed'; // 90% de succès

    // Créer le paiement
    const result = await db.query(
      `INSERT INTO payments (order_id, amount, payment_method, status, transaction_id)
       VALUES (?, ?, ?, ?, ?)`,
      [order_id, amount, payment_method, status, transaction_id]
    );

    // Mettre à jour le statut de la commande si paiement réussi
    if (status === 'completed') {
      await db.query(
        "UPDATE orders SET status = 'confirmed' WHERE id = ?",
        [order_id]
      );
    }

    res.status(201).json({
      success: true,
      message: status === 'completed' ? 'Paiement effectué' : 'Paiement échoué',
      data: {
        payment_id: result.insertId,
        order_id,
        amount,
        status,
        transaction_id
      }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/payments/:id/status - Mettre à jour le statut d'un paiement
router.put('/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'completed', 'failed', 'refunded'];
    if (!validStatuses.includes(status)) {
      const error = new Error(`Statut invalide. Valeurs possibles: ${validStatuses.join(', ')}`);
      error.status = 400;
      throw error;
    }

    const result = await db.query(
      'UPDATE payments SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      const error = new Error('Paiement non trouvé');
      error.status = 404;
      throw error;
    }

    res.json({
      success: true,
      message: 'Statut du paiement mis à jour'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/payments/:id/refund - Rembourser un paiement
router.post('/:id/refund', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Vérifier que le paiement existe et est complété
    const payments = await db.query(
      'SELECT * FROM payments WHERE id = ?',
      [id]
    );

    if (payments.length === 0) {
      const error = new Error('Paiement non trouvé');
      error.status = 404;
      throw error;
    }

    if (payments[0].status !== 'completed') {
      const error = new Error('Seuls les paiements complétés peuvent être remboursés');
      error.status = 400;
      throw error;
    }

    // Mettre à jour le statut
    await db.query(
      "UPDATE payments SET status = 'refunded' WHERE id = ?",
      [id]
    );

    // Mettre à jour la commande
    await db.query(
      "UPDATE orders SET status = 'cancelled' WHERE id = ?",
      [payments[0].order_id]
    );

    res.json({
      success: true,
      message: 'Paiement remboursé'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
