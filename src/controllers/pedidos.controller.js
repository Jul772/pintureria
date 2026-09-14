const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Crear pedido: el total NO se recibe del cliente, se recalcula acá en base
// al precio actual de cada variación (evitar que el front pueda mandar un total falso).
// Si viene codigoCupon, se busca la promoción, se valida vigencia y se descuenta del total.
const createPedido = async (req, res) => {
  const { origen, detalles, codigoCupon } = req.body;
  const tenantId = req.tenant.id;

  if (!Array.isArray(detalles) || detalles.length === 0) {
    return res.status(400).json({ error: 'El pedido debe tener al menos un detalle' });
  }

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      let subtotalPedido = 0;
      const detallesData = [];

      for (const d of detalles) {
        const variacion = await tx.variacion.findFirst({
          where: { id: d.variacionId, tenantId }
        });

        if (!variacion) {
          throw new Error(`Variación ${d.variacionId} no encontrada`);
        }

        const precioUnit = Number(variacion.precioBase);
        const subtotal = d.cantidad * precioUnit;
        subtotalPedido += subtotal;

        detallesData.push({
          variacionId: d.variacionId,
          cantidad: d.cantidad,
          precioUnit,
          subtotal
        });
      }

      let promocion = null;
      let descuento = 0;

      if (codigoCupon) {
        promocion = await tx.promocion.findFirst({
          where: { codigoCupon, tenantId, activo: true }
        });

        if (!promocion) {
          throw new Error('El cupón no existe o no está activo');
        }

        const ahora = new Date();
        if (ahora < promocion.fechaInicio || ahora > promocion.fechaFin) {
          throw new Error('El cupón no está vigente');
        }

        descuento = promocion.tipoDescuento === 'PORCENTAJE'
          ? subtotalPedido * (Number(promocion.valor) / 100)
          : Number(promocion.valor);

        descuento = Math.min(descuento, subtotalPedido);
      }

      const total = subtotalPedido - descuento;

      const nuevoPedido = await tx.pedido.create({
        data: {
          tenantId,
          origen,
          estado: 'PENDIENTE',
          total,
          descuento,
          promocionId: promocion ? promocion.id : null,
          detalles: { create: detallesData }
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

// GET /api/pedidos?estado=&origen=
const getPedidos = async (req, res) => {
  try {
    const tenantId = req.tenant.id;
    const { estado, origen } = req.query;

    const where = { tenantId };
    if (estado) where.estado = estado;
    if (origen) where.origen = origen;

    const pedidos = await prisma.pedido.findMany({
      where,
      include: { detalles: true },
      orderBy: { fechaPedido: 'desc' }
    });

    res.json(pedidos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los pedidos' });
  }
};

// GET /api/pedidos/:id
const getPedidoById = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant.id;

    const pedido = await prisma.pedido.findFirst({
      where: { id, tenantId },
      include: {
        detalles: { include: { variacion: true } },
        promocion: true
      }
    });

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    res.json(pedido);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el pedido' });
  }
};

const ESTADOS_VALIDOS = ['PENDIENTE', 'PAGADO', 'ENTREGADO', 'CANCELADO'];

// Transiciones de estado permitidas (evita, por ej, "entregar" algo cancelado)
const TRANSICIONES = {
  PENDIENTE: ['PAGADO', 'CANCELADO'],
  PAGADO: ['ENTREGADO', 'CANCELADO'],
  ENTREGADO: [],
  CANCELADO: []
};

// PATCH /api/pedidos/:id/estado  { estado }
const updateEstadoPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant.id;
    const { estado } = req.body;

    if (!ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({
        error: `Estado inválido. Debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}`
      });
    }

    const pedido = await prisma.pedido.findFirst({ where: { id, tenantId } });
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const permitidos = TRANSICIONES[pedido.estado] || [];
    if (!permitidos.includes(estado)) {
      return res.status(400).json({
        error: `No se puede pasar de ${pedido.estado} a ${estado}`
      });
    }

    const actualizado = await prisma.$transaction(async (tx) => {
      // Si se cancela, devolver el stock descontado al crear el pedido
      if (estado === 'CANCELADO') {
        const detalles = await tx.pedidoDetalle.findMany({ where: { pedidoId: id } });

        for (const detalle of detalles) {
          const stock = await tx.stock.findFirst({
            where: { variacionId: detalle.variacionId, tenantId }
          });

          if (stock) {
            await tx.stock.update({
              where: { id: stock.id },
              data: { cantidad: stock.cantidad + detalle.cantidad }
            });
          }
        }
      }

      return tx.pedido.update({ where: { id }, data: { estado } });
    });

    res.json(actualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el estado del pedido' });
  }
};

module.exports = {
  createPedido,
  getPedidos,
  getPedidoById,
  updateEstadoPedido
};
