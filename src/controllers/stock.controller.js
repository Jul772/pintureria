const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST /api/stock/:variacionId/reponer  { cantidad }
// Suma cantidad al stock existente (ej: llegó mercadería del proveedor)
const reponerStock = async (req, res) => {
  try {
    const { variacionId } = req.params;
    const tenantId = req.tenant.id;
    const { cantidad } = req.body;

    if (!cantidad || cantidad <= 0) {
      return res.status(400).json({ error: 'La cantidad a reponer debe ser mayor a 0' });
    }

    const stock = await prisma.stock.findFirst({ where: { variacionId, tenantId } });
    if (!stock) {
      return res.status(404).json({ error: 'No existe stock cargado para esa variación' });
    }

    const actualizado = await prisma.stock.update({
      where: { id: stock.id },
      data: { cantidad: stock.cantidad + cantidad }
    });

    res.json(actualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al reponer stock' });
  }
};

// PUT /api/stock/:variacionId  { cantidad?, stockMinimo?, alertaStock? }
// Ajuste manual (corrección de inventario, cambiar el mínimo, activar/desactivar alerta)
const ajustarStock = async (req, res) => {
  try {
    const { variacionId } = req.params;
    const tenantId = req.tenant.id;
    const { cantidad, stockMinimo, alertaStock } = req.body;

    const stock = await prisma.stock.findFirst({ where: { variacionId, tenantId } });
    if (!stock) {
      return res.status(404).json({ error: 'No existe stock cargado para esa variación' });
    }

    const data = {};
    if (cantidad !== undefined) data.cantidad = cantidad;
    if (stockMinimo !== undefined) data.stockMinimo = stockMinimo;
    if (alertaStock !== undefined) data.alertaStock = alertaStock;

    const actualizado = await prisma.stock.update({
      where: { id: stock.id },
      data
    });

    res.json(actualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al ajustar el stock' });
  }
};

module.exports = {
  reponerStock,
  ajustarStock
};
