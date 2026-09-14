const { PrismaClient } = require('@prisma/client');

// Instancia global de prisma para evitar múltiples conexiones en desarrollo
const prisma = new PrismaClient();

const tenantResolver = async (req, res, next) => {
  // 1. Extraer identificador del tenant
  // Prioridad 1: header explícito (ej: x-tenant-id)
  // Prioridad 2: Subdominio (ej: cliente1.dominio.com)
  const tenantIdHeader = req.headers['x-tenant-id'];
  let subdominio = null;

  if (!tenantIdHeader) {
    const host = req.get('host'); // ej: cliente1.saas.com
    if (host) {
      const parts = host.split('.');
      if (parts.length > 2) {
        subdominio = parts[0];
      }
    }
  }

  try {
    let tenant = null;

    if (tenantIdHeader) {
      tenant = await prisma.tenant.findUnique({
        where: { id: tenantIdHeader }
      });
    } else if (subdominio) {
      tenant = await prisma.tenant.findUnique({
        where: { subdominio }
      });
    }

    if (!tenant) {
      return res.status(403).json({
        error: 'Tenant no encontrado o no provisto. Se requiere x-tenant-id o subdominio válido.'
      });
    }

    if (!tenant.activo) {
      return res.status(403).json({
        error: 'El tenant se encuentra inactivo.'
      });
    }

    // 2. Inyectar el tenant en el objeto request para uso posterior
    req.tenant = tenant;
    next();
  } catch (error) {
    console.error('Error al resolver el tenant:', error);
    res.status(500).json({ error: 'Error interno del servidor al resolver el tenant.' });
  }
};

module.exports = tenantResolver;
