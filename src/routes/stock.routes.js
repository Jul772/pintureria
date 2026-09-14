const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const stockController = require('../controllers/stock.controller');

// POST /api/stock/:variacionId/reponer - sumar cantidad (reposición)
router.post('/:variacionId/reponer', authMiddleware, stockController.reponerStock);

// PUT /api/stock/:variacionId - ajuste manual (cantidad, stockMinimo, alertaStock)
router.put('/:variacionId', authMiddleware, stockController.ajustarStock);

module.exports = router;
