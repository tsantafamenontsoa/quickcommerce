// ============================================
// Routes : COMMANDES
// ============================================

const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/orders - Liste toutes les commandes
router.get('/', async (req, res, next) => {
  try {
    const status = req.query.status;
    const userId = req.query.user_id;

    let sql = `
      SELECT 
        o.*,
        u.email,
        u.first_name,
        u.last_name
      FROM orders o
      INNER JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND o.status = ?';
      params.push(status);
    }

    if (userId) {
      sql += ' AND o.user_id = ?';
      params.push(userId);
    }

    sql += ' ORDER BY o.created_at DESC';

    const orders = await db.query(sql, params);

    res.json({
      success: true,
      data: orders,
      count: orders.length
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/:id - Détails d'une commande
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Récupérer la commande
    const orders = await db.query(
      `SELECT 
        o.*,
        u.email,
        u.first_name,
        u.last_name
       FROM orders o
       INNER JOIN users u ON o.user_id = u.id
       WHERE o.id = ?`,
      [id]
    );

    if (orders.length === 0) {
      const error = new Error('Commande non trouvée');
      error.status = 404;
      throw error;
    }

    const order = orders[0];

    // Récupérer les articles de la commande
    const items = await db.query(
      `SELECT 
        oi.*,
        p.name as product_name,
        p.image_url
       FROM order_items oi
       INNER JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [id]
    );

    // Récupérer le paiement
    const payments = await db.query(
      'SELECT * FROM payments WHERE order_id = ?',
      [id]
    );

    res.json({
      success: true,
      data: {
        ...order,
        items,
        payment: payments[0] || null
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/orders - Créer une nouvelle commande
router.post('/', async (req, res, next) => {
  try {
    const { user_id, shipping_address } = req.body;

    // Validation
    if (!user_id || !shipping_address) {
      const error = new Error('Champs requis: user_id, shipping_address');
      error.status = 400;
      throw error;
    }

    // Transaction pour créer la commande
    const result = await db.transaction(async (connection) => {
      // Récupérer les articles du panier
      const [cartItems] = await connection.execute(
        `SELECT 
          c.product_id,
          c.quantity,
          p.price,
          p.stock_quantity
         FROM cart c
         INNER JOIN products p ON c.product_id = p.id
         WHERE c.user_id = ?`,
        [user_id]
      );

      if (cartItems.length === 0) {
        throw new Error('Panier vide');
      }

      // Vérifier le stock et calculer le total
      let total = 0;
      for (const item of cartItems) {
        if (item.stock_quantity < item.quantity) {
          throw new Error(`Stock insuffisant pour le produit ${item.product_id}`);
        }
        total += item.price * item.quantity;
      }

      // Créer la commande
      const [orderResult] = await connection.execute(
        `INSERT INTO orders (user_id, total_amount, status, shipping_address)
         VALUES (?, ?, 'pending', ?)`,
        [user_id, total, shipping_address]
      );

      const orderId = orderResult.insertId;

      // Créer les lignes de commande et décrémenter le stock
      for (const item of cartItems) {
        // Ajouter à order_items
        await connection.execute(
          `INSERT INTO order_items (order_id, product_id, quantity, price)
           VALUES (?, ?, ?, ?)`,
          [orderId, item.product_id, item.quantity, item.price]
        );

        // Décrémenter le stock
        await connection.execute(
          'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }

      // Vider le panier
      await connection.execute('DELETE FROM cart WHERE user_id = ?', [user_id]);

      return { orderId, total };
    });

    res.status(201).json({
      success: true,
      message: 'Commande créée',
      data: {
        order_id: result.orderId,
        total: result.total
      }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/orders/:id/status - Mettre à jour le statut d'une commande
router.put('/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      const error = new Error(`Statut invalide. Valeurs possibles: ${validStatuses.join(', ')}`);
      error.status = 400;
      throw error;
    }

    const result = await db.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      const error = new Error('Commande non trouvée');
      error.status = 404;
      throw error;
    }

    res.json({
      success: true,
      message: 'Statut mis à jour'
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/orders/:id - Annuler une commande
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Transaction pour annuler et remettre le stock
    await db.transaction(async (connection) => {
      // Récupérer les articles de la commande
      const [items] = await connection.execute(
        'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
        [id]
      );

      // Remettre le stock
      for (const item of items) {
        await connection.execute(
          'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }

      // Marquer la commande comme annulée
      await connection.execute(
        "UPDATE orders SET status = 'cancelled' WHERE id = ?",
        [id]
      );
    });

    res.json({
      success: true,
      message: 'Commande annulée'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
