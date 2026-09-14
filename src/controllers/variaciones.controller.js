const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST /api/productos/:productoId/variaciones
const createVariacion = async (req, res) => {
  try {
    const { productoId } = req.params;
    const tenantId = req.tenant.id;
    const {
      presentacion,
      color,
      superficie,
      precioBase,
      codigoBarras,
      cantidadInicial,
      stockMinimo
    } = req.body;

    const producto = await prisma.producto.findFirst({ where: { id: productoId, tenantId } });
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    if (!presentacion || precioBase === undefined) {
      return res.status(400).json({ error: 'presentacion y precioBase son obligatorios' });
    }

    const variacion = await prisma.variacion.create({
      data: {
        productoId,
        tenantId,
        presentacion,
        color,
        superficie,
        precioBase,
        codigoBarras,
        stock: {
          create: {
            tenantId,
            cantidad: cantidadInicial || 0,
            stockMinimo: stockMinimo ?? 5
          }
        }
      },
      include: { stock: true }
    });

    res.status(201).json(variacion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear la variación' });
  }
};

// PUT /api/variaciones/:id
const updateVariacion = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant.id;
    const { presentacion, color, superficie, precioBase, codigoBarras } = req.body;

    const existente = await prisma.variacion.findFirst({ where: { id, tenantId } });
    if (!existente) {
      return res.status(404).json({ error: 'Variación no encontrada' });
    }

    const variacion = await prisma.variacion.update({
      where: { id },
      data: { presentacion, color, superficie, precioBase, codigoBarras }
    });

    res.json(variacion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar la variación' });
  }
};

// DELETE /api/variaciones/:id
const deleteVariacion = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant.id;

    const existente = await prisma.variacion.findFirst({
      where: { id, tenantId },
      include: { pedidosDetalle: true }
    });

    if (!existente) {
      return res.status(404).json({ error: 'Variación no encontrada' });
    }

    if (existente.pedidosDetalle.length > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar una variación que ya tiene pedidos asociados.'
      });
    }

    await prisma.$transaction([
      prisma.stock.deleteMany({ where: { variacionId: id } }),
      prisma.variacion.delete({ where: { id } })
    ]);

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar la variación' });
  }
};

module.exports = {
  createVariacion,
  updateVariacion,
  deleteVariacion
};
