const express = require('express');
const router = express.Router();
const {
  obtenerTodasLasCuentas,
  obtenerCuentaPorId,
  realizarDeposito,
  realizarRetiro,
  realizarTransferencia,
  obtenerHistorial,
} = require('../controllers/cuentaController');

// Rutas auxiliares para listar todas las cuentas (alimenta el selector de la UI)
router.get('/cuentas', obtenerTodasLasCuentas);
router.get('/cuenta', obtenerTodasLasCuentas);

// Rutas oficiales estandarizadas de la consigna
router.get('/cuenta/:id', obtenerCuentaPorId);
router.post('/cuenta/deposito', realizarDeposito);
router.post('/cuenta/retiro', realizarRetiro);
router.post('/cuenta/transferencia', realizarTransferencia);
router.get('/cuenta/:id/historial', obtenerHistorial);

module.exports = router;

