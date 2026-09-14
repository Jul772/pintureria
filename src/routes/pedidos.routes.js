const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const pedidosController = require('../controllers/pedidos.controller');

// GET /api/pedidos?estado=&origen= - Listar pedidos
router.get('/', authMiddleware, pedidosController.getPedidos);

// GET /api/pedidos/:id - Ver detalle de un pedido
router.get('/:id', authMiddleware, pedidosController.getPedidoById);

// POST /api/pedidos - Crear pedido web/POS y descontar stock (acepta codigoCupon opcional)
router.post('/', authMiddleware, pedidosController.createPedido);

// PATCH /api/pedidos/:id/estado - Cambiar estado (PENDIENTE→PAGADO→ENTREGADO, o CANCELADO)
router.patch('/:id/estado', authMiddleware, pedidosController.updateEstadoPedido);

module.exports = router;
