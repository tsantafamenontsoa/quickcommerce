// ============================================
// Middleware de gestion d'erreurs
// ============================================

function errorHandler(err, req, res, next) {
  console.error('Erreur:', err);

  // Erreur de validation
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message
    });
  }

  // Erreur SQL
  if (err.code && err.code.startsWith('ER_')) {
    return res.status(500).json({
      error: 'Database Error',
      message: 'Erreur base de données',
      code: err.code
    });
  }

  // Erreur 404
  if (err.status === 404) {
    return res.status(404).json({
      error: 'Not Found',
      message: err.message || 'Ressource non trouvée'
    });
  }

  // Erreur générique
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: err.message || 'Une erreur est survenue'
  });
}

// Middleware 404
function notFound(req, res) {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} non trouvée`
  });
}

module.exports = {
  errorHandler,
  notFound
};
