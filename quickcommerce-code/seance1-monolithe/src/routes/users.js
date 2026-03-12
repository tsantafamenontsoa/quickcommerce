// ============================================
// Routes : UTILISATEURS
// ============================================

const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/users - Liste tous les utilisateurs
router.get('/', async (req, res, next) => {
  try {
    const users = await db.query(
      'SELECT id, email, first_name, last_name, created_at FROM users ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:id - Détails d'un utilisateur
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const users = await db.query(
      'SELECT id, email, first_name, last_name, created_at FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      const error = new Error('Utilisateur non trouvé');
      error.status = 404;
      throw error;
    }

    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/users - Créer un utilisateur
router.post('/', async (req, res, next) => {
  try {
    const { email, password, first_name, last_name } = req.body;

    // Validation
    if (!email || !password || !first_name || !last_name) {
      const error = new Error('Champs requis: email, password, first_name, last_name');
      error.status = 400;
      throw error;
    }

    // Note: En production, hacher le mot de passe avec bcrypt
    const hashedPassword = `hashed_${password}`; // Simplification pour la démo

    const result = await db.query(
      `INSERT INTO users (email, password, first_name, last_name)
       VALUES (?, ?, ?, ?)`,
      [email, hashedPassword, first_name, last_name]
    );

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé',
      data: {
        id: result.insertId,
        email,
        first_name,
        last_name
      }
    });
  } catch (error) {
    // Gérer l'erreur d'email dupliqué
    if (error.code === 'ER_DUP_ENTRY') {
      error.message = 'Cet email est déjà utilisé';
      error.status = 400;
    }
    next(error);
  }
});

// PUT /api/users/:id - Mettre à jour un utilisateur
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, first_name, last_name } = req.body;

    const result = await db.query(
      `UPDATE users 
       SET email = COALESCE(?, email),
           first_name = COALESCE(?, first_name),
           last_name = COALESCE(?, last_name)
       WHERE id = ?`,
      [email, first_name, last_name, id]
    );

    if (result.affectedRows === 0) {
      const error = new Error('Utilisateur non trouvé');
      error.status = 404;
      throw error;
    }

    res.json({
      success: true,
      message: 'Utilisateur mis à jour'
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/users/:id - Supprimer un utilisateur
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM users WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      const error = new Error('Utilisateur non trouvé');
      error.status = 404;
      throw error;
    }

    res.json({
      success: true,
      message: 'Utilisateur supprimé'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
