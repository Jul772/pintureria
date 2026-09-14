const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createPedido = async (req, res) => {
  const { origen, estado, total, detalles } = req.body;
  const tenantId = req.tenant.id;

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const nuevoPedido = await tx.pedido.create({
        data: {
          tenantId,
          origen,
          estado,
          total,
          detalles: {
            create: detalles.map(d => ({
              variacionId: d.variacionId,
              cantidad: d.cantidad,
              precioUnit: d.precioUnit,
              subtotal: d.cantidad * d.precioUnit
            }))
          }
        },
        include: { detalles: true }
      });

      for (const detalle of detalles) {
        const stockActual = await tx.stock.findFirst({
          where: { variacionId: detalle.variacionId, tenantId }
        });

        if (!stockActual || stockActual.cantidad < detalle.cantidad) {
          throw new Error(`Stock insuficiente para la variación ${detalle.variacionId}`);
        }

        await tx.stock.update({
          where: { id: stockActual.id },
          data: {
            cantidad: stockActual.cantidad - detalle.cantidad
          }
        });
      }

      return nuevoPedido;
    });

    res.status(201).json(resultado);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Error al procesar el pedido' });
  }
};

module.exports = {
  createPedido
};
