require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

const cuentaRoutes = require('./routes/cuentaRoutes');

const app = express();

// Middlewares globales
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Endpoint de verificación del servicio
app.get('/', (req, res) => {
  res.json({
    nombre: 'API de Gestión de Cuenta Bancaria Simplificada',
    estado: 'Servicio en línea',
    version: '1.0.0',
    endpoints: {
      todasLasCuentas: 'GET /api/cuentas',
      cuentaPorId: 'GET /api/cuenta/:id',
      deposito: 'POST /api/cuenta/deposito',
      retiro: 'POST /api/cuenta/retiro',
      transferencia: 'POST /api/cuenta/transferencia',
      historial: 'GET /api/cuenta/:id/historial',
    },
  });
});

// Enrutador de la API
app.use('/api', cuentaRoutes);

// Manejo de rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({
    mensaje: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
});

// Middleware centralizado de errores
app.use((err, req, res, next) => {
  // JSON mal formado: express.json() marca el error con status 400 (culpa del cliente)
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      mensaje: 'El cuerpo de la petición no es un JSON válido',
    });
  }

  // Cualquier otro error imprevisto es culpa del servidor (500)
  console.error('Error no controlado en el servidor:', err);
  res.status(err.status || 500).json({
    mensaje: 'Ocurrió un error inesperado en el servidor',
    error: err.message,
  });
});

// Configuración y conexión a la base de datos MongoDB local
const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://localhost:27017/banco_db';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ Conexión establecida exitosamente con MongoDB local en:', MONGO_URI);
    app.listen(PORT, () => {
      console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Error crítico al conectar con MongoDB:', error.message);
    process.exit(1);
  });

