const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createPromocion = async (req, res) => {
  try {
    const { nombre, descripcion, tipoDescuento, valor, fechaInicio, fechaFin, codigoCupon } = req.body;
    const tenantId = req.tenant.id;

    const nuevaPromocion = await prisma.promocion.create({
      data: {
        tenantId,
        nombre,
        descripcion,
        tipoDescuento,
        valor,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        codigoCupon
      }
    });

    res.status(201).json(nuevaPromocion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear la promoción' });
  }
};

const getPromociones = async (req, res) => {
  try {
    const tenantId = req.tenant.id;
    const { activo } = req.query;

    const where = { tenantId };
    if (activo !== undefined) where.activo = activo === 'true';

    const promociones = await prisma.promocion.findMany({ where });
    res.json(promociones);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener las promociones' });
  }
};

const getPromocionById = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant.id;

    const promocion = await prisma.promocion.findFirst({ where: { id, tenantId } });
    if (!promocion) {
      return res.status(404).json({ error: 'Promoción no encontrada' });
    }

    res.json(promocion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener la promoción' });
  }
};

const updatePromocion = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant.id;
    const { nombre, descripcion, tipoDescuento, valor, fechaInicio, fechaFin, codigoCupon } = req.body;

    const existente = await prisma.promocion.findFirst({ where: { id, tenantId } });
    if (!existente) {
      return res.status(404).json({ error: 'Promoción no encontrada' });
    }

    const promocion = await prisma.promocion.update({
      where: { id },
      data: {
        nombre,
        descripcion,
        tipoDescuento,
        valor,
        fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
        fechaFin: fechaFin ? new Date(fechaFin) : undefined,
        codigoCupon
      }
    });

    res.json(promocion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar la promoción' });
  }
};

const desactivarPromocion = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant.id;

    const existente = await prisma.promocion.findFirst({ where: { id, tenantId } });
    if (!existente) {
      return res.status(404).json({ error: 'Promoción no encontrada' });
    }

    const promocion = await prisma.promocion.update({
      where: { id },
      data: { activo: false }
    });

    res.json(promocion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al desactivar la promoción' });
  }
};

const deletePromocion = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant.id;

    const existente = await prisma.promocion.findFirst({
      where: { id, tenantId },
      include: { pedidos: true }
    });

    if (!existente) {
      return res.status(404).json({ error: 'Promoción no encontrada' });
    }

    if (existente.pedidos.length > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar una promoción que ya fue usada en pedidos. Desactivala en su lugar.'
      });
    }

    await prisma.promocion.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar la promoción' });
  }
};

module.exports = {
  createPromocion,
  getPromociones,
  getPromocionById,
  updatePromocion,
  desactivarPromocion,
  deletePromocion
};
