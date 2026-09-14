const express = require('express');
const cors = require('cors');
const tenantResolver = require('./middlewares/tenantResolver');

// Importar rutas
const authRoutes = require('./routes/auth.routes');
const productosRoutes = require('./routes/productos.routes');
const pedidosRoutes = require('./routes/pedidos.routes');
const promocionesRoutes = require('./routes/promociones.routes');
const variacionesRoutes = require('./routes/variaciones.routes');
const stockRoutes = require('./routes/stock.routes');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Endpoint de prueba de salud
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'SaaS Pinturería API is running' });
});

// Middleware Multi-Tenant aplicado globalmente a todas las rutas bajo /api
// Excepto si hay rutas genéricas o de administración super-admin
app.use('/api', tenantResolver);

// Registrar Rutas
app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/promociones', promocionesRoutes);
app.use('/api/variaciones', variacionesRoutes);
app.use('/api/stock', stockRoutes);

// Manejo de errores genérico
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Ocurrió un error inesperado en el servidor.' });
});

module.exports = app;
