require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const cuentaRoutes = require('./routes/cuentaRoutes');

// Iniciar mini-servidor para pruebas
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', cuentaRoutes);

const runTests = async () => {
  const MONGO_URI =
    process.env.MONGO_URI || 'mongodb://localhost:27017/banco_db';
  await mongoose.connect(MONGO_URI);
  console.log(' Conectado a MongoDB para pruebas.');

  const server = app.listen(5099, async () => {
    const BASE_URL = 'http://localhost:5099/api';
    let totalTests = 0;
    let passedTests = 0;

    const assert = (condition, description) => {
      totalTests++;
      if (condition) {
        passedTests++;
        console.log(`  PASO: ${description}`);
      } else {
        console.error(`❌ FALLO: ${description}`);
      }
    };

    try {
      console.log('\n--- INICIO DE PRUEBAS AUTOMATIZADAS DE API REST ---\n');

      // Test 1: GET /api/cuentas
      const resCuentas = await fetch(`${BASE_URL}/cuentas`);
      const cuentas = await resCuentas.json();
      assert(resCuentas.status === 200 && cuentas.length >= 2, 'GET /api/cuentas retorna lista de cuentas');

      const cuentaA = cuentas[0];
      const cuentaB = cuentas[1];
      console.log(`  Cuenta A: ${cuentaA.titular} (${cuentaA.numeroCuenta}) Saldo: $${cuentaA.saldo}`);
      console.log(`  Cuenta B: ${cuentaB.titular} (${cuentaB.numeroCuenta}) Saldo: $${cuentaB.saldo}`);

      // Test 2: GET /api/cuenta/:id por _id y por numeroCuenta
      const resPorId = await fetch(`${BASE_URL}/cuenta/${cuentaA._id}`);
      assert(resPorId.status === 200, 'GET /api/cuenta/:id funciona por _id de MongoDB');

      const resPorNumero = await fetch(`${BASE_URL}/cuenta/${cuentaA.numeroCuenta}`);
      assert(resPorNumero.status === 200, 'GET /api/cuenta/:id funciona por numeroCuenta bancario');

      // Test 3: GET /api/cuenta/:id inexistente -> 404
      const resInexistente = await fetch(`${BASE_URL}/cuenta/NO_EXISTE_999`);
      assert(resInexistente.status === 404, 'GET /api/cuenta/:id con cuenta inexistente retorna 404');

      // Test 4: POST /api/cuenta/deposito válido
      const saldoInicialA = cuentaA.saldo;
      const resDep = await fetch(`${BASE_URL}/cuenta/deposito`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cuentaId: cuentaA._id, monto: 200, descripcion: 'Prueba depósito' }),
      });
      const dataDep = await resDep.json();
      assert(resDep.status === 200 && dataDep.cuenta.saldo === saldoInicialA + 200, 'POST /api/cuenta/deposito incrementa el saldo correctamente');

      // Test 5: POST /api/cuenta/deposito con monto inválido -> 400
      const resDepInvalido = await fetch(`${BASE_URL}/cuenta/deposito`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cuentaId: cuentaA._id, monto: -50 }),
      });
      assert(resDepInvalido.status === 400, 'POST /api/cuenta/deposito con monto negativo retorna 400');

      // Test 6: POST /api/cuenta/retiro válido
      const resRet = await fetch(`${BASE_URL}/cuenta/retiro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cuentaId: cuentaA._id, monto: 100, descripcion: 'Prueba retiro' }),
      });
      const dataRet = await resRet.json();
      assert(resRet.status === 200 && dataRet.cuenta.saldo === saldoInicialA + 100, 'POST /api/cuenta/retiro descuenta el saldo correctamente');

      // Test 7: POST /api/cuenta/retiro con saldo insuficiente -> 400 (evitar saldo negativo)
      const resRetExcesivo = await fetch(`${BASE_URL}/cuenta/retiro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cuentaId: cuentaA._id, monto: 999999 }),
      });
      assert(resRetExcesivo.status === 400, 'POST /api/cuenta/retiro con saldo insuficiente retorna 400 y previene saldo negativo');

      // Test 8: POST /api/cuenta/transferencia a la misma cuenta -> 400
      const resTransfMisma = await fetch(`${BASE_URL}/cuenta/transferencia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cuentaOrigenId: cuentaA._id, cuentaDestinoId: cuentaA._id, monto: 50 }),
      });
      assert(resTransfMisma.status === 400, 'POST /api/cuenta/transferencia a la misma cuenta retorna 400');

      // Test 9: POST /api/cuenta/transferencia a cuenta inexistente -> 404
      const resTransfNoExiste = await fetch(`${BASE_URL}/cuenta/transferencia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cuentaOrigenId: cuentaA._id, cuentaDestinoId: 'INEXISTENTE_999', monto: 50 }),
      });
      assert(resTransfNoExiste.status === 404, 'POST /api/cuenta/transferencia a cuenta inexistente retorna 404');

      // Test 10: POST /api/cuenta/transferencia válida entre cuentas
      const saldoPrevioA = (await (await fetch(`${BASE_URL}/cuenta/${cuentaA._id}`)).json()).saldo;
      const saldoPrevioB = (await (await fetch(`${BASE_URL}/cuenta/${cuentaB._id}`)).json()).saldo;
      const montoTransf = 300;

      const resTransfValida = await fetch(`${BASE_URL}/cuenta/transferencia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cuentaOrigenId: cuentaA._id,
          cuentaDestinoId: cuentaB.numeroCuenta, // Probamos pasar el numeroCuenta bancario en vez de _id
          monto: montoTransf,
          descripcion: 'Pago de prueba automatizada',
        }),
      });
      const dataTransf = await resTransfValida.json();
      assert(
        resTransfValida.status === 200 &&
        dataTransf.cuentaOrigen.saldo === saldoPrevioA - montoTransf &&
        dataTransf.cuentaDestino.saldo === saldoPrevioB + montoTransf,
        'POST /api/cuenta/transferencia actualiza ambos saldos de forma consistente'
      );

      // Test 11: GET /api/cuenta/:id/historial
      const resHistorial = await fetch(`${BASE_URL}/cuenta/${cuentaA._id}/historial`);
      const historial = await resHistorial.json();
      assert(resHistorial.status === 200 && Array.isArray(historial) && historial.length >= 3, 'GET /api/cuenta/:id/historial retorna historial cronológico con movimientos');

      console.log(`\n==============================================`);
      console.log(`🏁 RESUMEN DE PRUEBAS: ${passedTests}/${totalTests} superadas.`);
      console.log(`==============================================\n`);
    } catch (err) {
      console.error('Error durante las pruebas:', err);
    } finally {
      server.close();
      await mongoose.disconnect();
      process.exit(0);
    }
  });
};

runTests();

