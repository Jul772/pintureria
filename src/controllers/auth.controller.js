const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // MOCK LOGIN
    if (email === 'admin@' + req.tenant.subdominio + '.com' && password === '123456') {
      const secret = process.env.JWT_SECRET || 'supersecret';
      const token = jwt.sign(
        { userId: '123', email, tenantId: req.tenant.id },
        secret,
        { expiresIn: '8h' }
      );
      
      return res.json({ token, tenant: req.tenant.nombre });
    }

    res.status(401).json({ error: 'Credenciales inválidas' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

module.exports = {
  login
};
