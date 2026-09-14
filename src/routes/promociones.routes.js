const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const promocionesController = require('../controllers/promociones.controller');

// GET /api/promociones?activo=true - Listar promociones
router.get('/', authMiddleware, promocionesController.getPromociones);

// GET /api/promociones/:id - Ver una promoción
router.get('/:id', authMiddleware, promocionesController.getPromocionById);

// POST /api/promociones - Crear promocion
router.post('/', authMiddleware, promocionesController.createPromocion);

// PUT /api/promociones/:id - Editar promoción
router.put('/:id', authMiddleware, promocionesController.updatePromocion);

// PATCH /api/promociones/:id/desactivar
router.patch('/:id/desactivar', authMiddleware, promocionesController.desactivarPromocion);

// DELETE /api/promociones/:id
router.delete('/:id', authMiddleware, promocionesController.deletePromocion);

module.exports = router;
