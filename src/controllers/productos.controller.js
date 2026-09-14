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

const getProductoById = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant.id;

    const producto = await prisma.producto.findFirst({
      where: { id, tenantId },
      include: {
        variaciones: {
          include: { stock: true }
        }
      }
    });

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(producto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el producto' });
  }
};

const createProducto = async (req, res) => {
  try {
    const { nombre, descripcion, marca, tipo } = req.body;
    const tenantId = req.tenant.id;

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre del producto es obligatorio' });
    }

    const producto = await prisma.producto.create({
      data: { tenantId, nombre, descripcion, marca, tipo }
    });

    res.status(201).json(producto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el producto' });
  }
};

const updateProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant.id;
    const { nombre, descripcion, marca, tipo } = req.body;

    const existente = await prisma.producto.findFirst({ where: { id, tenantId } });
    if (!existente) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const producto = await prisma.producto.update({
      where: { id },
      data: { nombre, descripcion, marca, tipo }
    });

    res.json(producto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el producto' });
  }
};

const deleteProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant.id;

    const existente = await prisma.producto.findFirst({
      where: { id, tenantId },
      include: { variaciones: true }
    });

    if (!existente) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    if (existente.variaciones.length > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar un producto que tiene variaciones cargadas. Eliminá primero sus variaciones.'
      });
    }

    await prisma.producto.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el producto' });
  }
};

module.exports = {
  getProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto
};
