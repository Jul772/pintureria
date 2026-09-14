const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const pedidosController = require('../controllers/pedidos.controller');

// POST /api/pedidos - Crear pedido web y descontar stock
router.post('/', authMiddleware, pedidosController.createPedido);

module.exports = router;
