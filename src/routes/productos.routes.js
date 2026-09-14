const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const productosController = require('../controllers/productos.controller');
const variacionesController = require('../controllers/variaciones.controller');

// GET /api/productos - Obtener catálogo con filtros (público, sin auth: es el catálogo)
router.get('/', productosController.getProductos);
router.get('/:id', productosController.getProductoById);

// Gestión de productos (requiere auth)
router.post('/', authMiddleware, productosController.createProducto);
router.put('/:id', authMiddleware, productosController.updateProducto);
router.delete('/:id', authMiddleware, productosController.deleteProducto);

// Variaciones anidadas al producto
router.post('/:productoId/variaciones', authMiddleware, variacionesController.createVariacion);

module.exports = router;
