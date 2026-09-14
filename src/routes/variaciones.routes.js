const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const variacionesController = require('../controllers/variaciones.controller');

// PUT /api/variaciones/:id
router.put('/:id', authMiddleware, variacionesController.updateVariacion);

// DELETE /api/variaciones/:id
router.delete('/:id', authMiddleware, variacionesController.deleteVariacion);

module.exports = router;
