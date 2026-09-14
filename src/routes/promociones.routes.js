const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const promocionesController = require('../controllers/promociones.controller');

// POST /api/promociones - Crear promocion
router.post('/', authMiddleware, promocionesController.createPromocion);

module.exports = router;
