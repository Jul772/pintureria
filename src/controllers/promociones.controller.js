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

module.exports = {
  createPromocion
};
