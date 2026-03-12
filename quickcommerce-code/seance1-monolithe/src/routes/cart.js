// ============================================
// Routes : PANIER
// ============================================

const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/cart/:userId - Récupérer le panier d'un utilisateur
router.get('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;

    const cartItems = await db.query(
      `SELECT 
        c.id,
        c.quantity,
        c.added_at,
        p.id as product_id,
        p.name as product_name,
        p.price,
        p.image_url,
        (c.quantity * p.price) as subtotal
       FROM cart c
       INNER JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ?
       ORDER BY c.added_at DESC`,
      [userId]
    );

    // Calculer le total
    const total = cartItems.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);

    res.json({
      success: true,
      data: {
        items: cartItems,
        total: total.toFixed(2),
        count: cartItems.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/cart - Ajouter un produit au panier
router.post('/', async (req, res, next) => {
  try {
    const { user_id, product_id, quantity } = req.body;

    // Validation
    if (!user_id || !product_id || !quantity) {
      const error = new Error('Champs requis: user_id, product_id, quantity');
      error.status = 400;
      throw error;
    }

    if (quantity <= 0) {
      const error = new Error('La quantité doit être supérieure à 0');
      error.status = 400;
      throw error;
    }

    // Vérifier que le produit existe et a assez de stock
    const products = await db.query(
      'SELECT id, stock_quantity FROM products WHERE id = ?',
      [product_id]
    );

    if (products.length === 0) {
      const error = new Error('Produit non trouvé');
      error.status = 404;
      throw error;
    }

    if (products[0].stock_quantity < quantity) {
      const error = new Error('Stock insuffisant');
      error.status = 400;
      throw error;
    }

    // Ajouter au panier (ou mettre à jour si existe)
    await db.query(
      `INSERT INTO cart (user_id, product_id, quantity)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
      [user_id, product_id, quantity, quantity]
    );

    res.status(201).json({
      success: true,
      message: 'Produit ajouté au panier'
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/cart/:id - Mettre à jour la quantité
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity <= 0) {
      const error = new Error('La quantité doit être supérieure à 0');
      error.status = 400;
      throw error;
    }

    const result = await db.query(
      'UPDATE cart SET quantity = ? WHERE id = ?',
      [quantity, id]
    );

    if (result.affectedRows === 0) {
      const error = new Error('Article de panier non trouvé');
      error.status = 404;
      throw error;
    }

    res.json({
      success: true,
      message: 'Quantité mise à jour'
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/cart/:id - Supprimer un article du panier
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM cart WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      const error = new Error('Article de panier non trouvé');
      error.status = 404;
      throw error;
    }

    res.json({
      success: true,
      message: 'Article supprimé du panier'
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/cart/user/:userId - Vider le panier d'un utilisateur
router.delete('/user/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;

    await db.query('DELETE FROM cart WHERE user_id = ?', [userId]);

    res.json({
      success: true,
      message: 'Panier vidé'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
