const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const productosController = require('../controllers/productos.controller');

// GET /api/productos - Obtener catálogo con filtros
router.get('/', productosController.getProductos);

module.exports = router;
