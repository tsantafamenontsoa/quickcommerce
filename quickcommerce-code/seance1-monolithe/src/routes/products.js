// ============================================
// Routes : PRODUITS (Catalogue)
// ============================================

const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/products - Liste tous les produits
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const category = req.query.category;

    let sql = 'SELECT * FROM products';
    let params = [];

    // Filtrer par catégorie si spécifié
    if (category) {
      sql += ' WHERE category = ?';
      params.push(category);
    }

    sql += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    // Note: On utilise l'interpolation pour LIMIT/OFFSET car mysql2 a des problèmes avec les placeholders

    const products = await db.query(sql, params);

    // Compter le total
    let countSql = 'SELECT COUNT(*) as total FROM products';
    let countParams = [];
    if (category) {
      countSql += ' WHERE category = ?';
      countParams = [category];
    }
    
    const [countResult] = await db.query(countSql, countParams);
    const total = countResult.total;

    res.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/products/:id - Détails d'un produit
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const products = await db.query(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );

    if (products.length === 0) {
      const error = new Error('Produit non trouvé');
      error.status = 404;
      throw error;
    }

    res.json({
      success: true,
      data: products[0]
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/products - Créer un nouveau produit (admin)
router.post('/', async (req, res, next) => {
  try {
    const { name, description, price, stock_quantity, category, image_url } = req.body;

    // Validation
    if (!name || !price || stock_quantity === undefined) {
      const error = new Error('Champs requis: name, price, stock_quantity');
      error.status = 400;
      throw error;
    }

    const result = await db.query(
      `INSERT INTO products (name, description, price, stock_quantity, category, image_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, description, price, stock_quantity, category, image_url]
    );

    res.status(201).json({
      success: true,
      message: 'Produit créé',
      data: {
        id: result.insertId,
        name,
        price,
        stock_quantity
      }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/products/:id - Mettre à jour un produit
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock_quantity, category, image_url } = req.body;

    const result = await db.query(
      `UPDATE products 
       SET name = COALESCE(?, name),
           description = COALESCE(?, description),
           price = COALESCE(?, price),
           stock_quantity = COALESCE(?, stock_quantity),
           category = COALESCE(?, category),
           image_url = COALESCE(?, image_url)
       WHERE id = ?`,
      [name, description, price, stock_quantity, category, image_url, id]
    );

    if (result.affectedRows === 0) {
      const error = new Error('Produit non trouvé');
      error.status = 404;
      throw error;
    }

    res.json({
      success: true,
      message: 'Produit mis à jour'
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/products/:id - Supprimer un produit
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM products WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      const error = new Error('Produit non trouvé');
      error.status = 404;
      throw error;
    }

    res.json({
      success: true,
      message: 'Produit supprimé'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/products/category/:category - Produits par catégorie
router.get('/category/:category', async (req, res, next) => {
  try {
    const { category } = req.params;

    const products = await db.query(
      'SELECT * FROM products WHERE category = ? ORDER BY created_at DESC',
      [category]
    );

    res.json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
