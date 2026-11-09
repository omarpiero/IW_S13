require('dotenv').config();
const mongoose = require('mongoose');
const Cuenta = require('./models/Cuenta');
const Transaccion = require('./models/Transaccion');

/**
 * ============================================================================
 * 👥 BANCO DE USUARIOS / CUENTAS DE ENTRADA
 * ============================================================================
 * Puedes agregar, modificar o eliminar cuentas en esta lista.
 * Cada vez que ejecutes 'npm run seed', la base de datos se reinicializará
 * con estos registros limpios y listos para probar en la interfaz.
 */
const CUENTAS_INICIALES = [
  {
    titular: 'Juan Pérez',
    numeroCuenta: 'CTA-1001',
    saldo: 1500.0,
    tipoCuenta: 'Ahorros',
  },
  {
    titular: 'María Gómez',
    numeroCuenta: 'CTA-1002',
    saldo: 3200.0,
    tipoCuenta: 'Corriente',
  },
  {
    titular: 'Carlos Rodríguez',
    numeroCuenta: 'CTA-1003',
    saldo: 500.0,
    tipoCuenta: 'Ahorros',
  },
  {
    titular: 'Ana Martínez',
    numeroCuenta: 'CTA-1004',
    saldo: 10000.0,
    tipoCuenta: 'Corriente',
  },
];

/**
 * Función principal de siembra (Seed)
 */
const sembrarBaseDeDatos = async () => {
  const MONGO_URI =
    process.env.MONGO_URI || 'mongodb://localhost:27017/banco_db';

  try {
    console.log('🔄 Conectando a MongoDB para inicializar datos...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a:', MONGO_URI);

    // 1. Limpieza de datos antiguos
    console.log('🧹 Eliminando datos antiguos de cuentas y transacciones...');
    await Cuenta.deleteMany({});
    await Transaccion.deleteMany({});

    // 2. Inserción de cuentas iniciales
    console.log('🌱 Insertando cuentas iniciales...');
    const cuentasCreadas = await Cuenta.insertMany(CUENTAS_INICIALES);

    // 3. Generación automática de transacción de apertura para cada cuenta
    console.log('📝 Generando transacciones iniciales de apertura...');
    const transaccionesIniciales = cuentasCreadas.map((cuenta) => ({
      cuentaId: cuenta._id,
      tipo: 'DEPOSITO',
      monto: cuenta.saldo,
      saldoPosterior: cuenta.saldo,
      descripcion: 'Saldo inicial de apertura de cuenta',
      fecha: new Date(Date.now() - 1000 * 60 * 60 * 24), // Hace 24 horas
    }));

    await Transaccion.insertMany(transaccionesIniciales);

    // 4. Resumen en consola
    console.log('\n========================================================');
    console.log('🎉 ¡Base de datos poblada exitosamente con datos de prueba!');
    console.log('========================================================');
    console.table(
      cuentasCreadas.map((c) => ({
        ID: c._id.toString(),
        Titular: c.titular,
        'N° Cuenta': c.numeroCuenta,
        Tipo: c.tipoCuenta,
        Saldo: `$${c.saldo.toFixed(2)}`,
      }))
    );
    console.log('========================================================\n');
  } catch (error) {
    console.error('❌ Error al ejecutar el script de seed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Conexión cerrada con éxito.');
    process.exit(0);
  }
};

sembrarBaseDeDatos();

