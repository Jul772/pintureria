const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getProductos = async (req, res) => {
  try {
    const { tipo, marca, presentacion } = req.query;
    const tenantId = req.tenant.id;

    const where = { tenantId };

    if (tipo) where.tipo = tipo;
    if (marca) where.marca = marca;
    
    if (presentacion) {
       where.variaciones = {
          some: { presentacion }
       };
    }

    const productos = await prisma.producto.findMany({
      where,
      include: {
        variaciones: {
          include: {
            stock: true
          }
        }
      }
    });

    res.json(productos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

module.exports = {
  getProductos
};
