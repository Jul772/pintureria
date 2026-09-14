const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No se proporcionó token de autenticación' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // JWT_SECRET debe configurarse en el .env
    const secret = process.env.JWT_SECRET || 'supersecret';
    const decoded = jwt.verify(token, secret);
    
    // Validar que el token pertenece al mismo tenant de la petición
    if (decoded.tenantId && req.tenant && decoded.tenantId !== req.tenant.id) {
       return res.status(403).json({ error: 'El token no pertenece al tenant actual' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

module.exports = authMiddleware;
