const mongoose = require('mongoose');
const Cuenta = require('../models/Cuenta');
const Transaccion = require('../models/Transaccion');

/**
 * Función auxiliar para buscar una cuenta tanto por su _id de MongoDB
 * como por su número de cuenta bancario (ej: 'CTA-1001').
 */
const buscarCuentaPorIdONumero = async (param) => {
  if (!param) return null;
  const esObjectId = mongoose.Types.ObjectId.isValid(param);
  if (esObjectId) {
    return await Cuenta.findOne({
      $or: [{ _id: param }, { numeroCuenta: param }],
    });
  }
  return await Cuenta.findOne({ numeroCuenta: String(param).trim() });
};

/**
 * GET /api/cuentas
 * Obtiene la lista completa de cuentas registradas (útil para el selector en frontend).
 */
const obtenerTodasLasCuentas = async (req, res) => {
  try {
    const cuentas = await Cuenta.find().sort({ numeroCuenta: 1 });
    return res.status(200).json(cuentas);
  } catch (error) {
    console.error('Error al obtener cuentas:', error);
    return res.status(500).json({
      mensaje: 'Error interno del servidor al obtener las cuentas',
      error: error.message,
    });
  }
};

/**
 * GET /api/cuenta/:id
 * Obtiene el saldo y los datos de una cuenta específica.
 */
const obtenerCuentaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const cuenta = await buscarCuentaPorIdONumero(id);

    if (!cuenta) {
      return res.status(404).json({ mensaje: 'Cuenta no encontrada' });
    }

    return res.status(200).json(cuenta);
  } catch (error) {
    console.error('Error al obtener la cuenta:', error);
    return res.status(500).json({
      mensaje: 'Error interno del servidor al consultar la cuenta',
      error: error.message,
    });
  }
};

/**
 * POST /api/cuenta/deposito
 * Registra un depósito en la cuenta indicada aumentando su saldo.
 * Body: { cuentaId, monto, descripcion }
 */
const realizarDeposito = async (req, res) => {
  try {
    const { cuentaId, monto, descripcion } = req.body;

    // Validación 1: Campos requeridos
    if (!cuentaId || monto === undefined || monto === null) {
      return res.status(400).json({
        mensaje: 'El identificador de la cuenta y el monto son obligatorios',
      });
    }

    // Validación 2: Monto numérico y estrictamente positivo
    const montoNumerico = Number(parseFloat(monto).toFixed(2));
    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      return res.status(400).json({
        mensaje: 'El monto a depositar debe ser un número mayor a 0',
      });
    }

    // Validación 3: Longitud de descripción
    if (descripcion && descripcion.length > 100) {
      return res.status(400).json({
        mensaje: 'La descripción no puede superar los 100 caracteres',
      });
    }

    // Buscar la cuenta
    const cuenta = await buscarCuentaPorIdONumero(cuentaId);
    if (!cuenta) {
      return res.status(404).json({ mensaje: 'Cuenta no encontrada' });
    }

    // Actualización atómica del saldo ($inc asegura consistencia ante concurrencia)
    const cuentaActualizada = await Cuenta.findByIdAndUpdate(
      cuenta._id,
      { $inc: { saldo: montoNumerico } },
      { new: true, runValidators: true }
    );

    // Registro del movimiento en el historial
    const transaccion = await Transaccion.create({
      cuentaId: cuentaActualizada._id,
      tipo: 'DEPOSITO',
      monto: montoNumerico,
      saldoPosterior: cuentaActualizada.saldo,
      descripcion: (descripcion || 'Depósito de fondos').trim(),
    });

    return res.status(200).json({
      mensaje: 'Depósito realizado con éxito',
      cuenta: cuentaActualizada,
      transaccion,
    });
  } catch (error) {
    console.error('Error en depósito:', error);
    return res.status(500).json({
      mensaje: 'Error interno del servidor al procesar el depósito',
      error: error.message,
    });
  }
};

/**
 * POST /api/cuenta/retiro
 * Registra un retiro de la cuenta validando que no se supere el saldo disponible.
 * Body: { cuentaId, monto, descripcion }
 */
const realizarRetiro = async (req, res) => {
  try {
    const { cuentaId, monto, descripcion } = req.body;

    // Validación 1: Campos obligatorios
    if (!cuentaId || monto === undefined || monto === null) {
      return res.status(400).json({
        mensaje: 'El identificador de la cuenta y el monto son obligatorios',
      });
    }

    // Validación 2: Monto válido mayor a 0
    const montoNumerico = Number(parseFloat(monto).toFixed(2));
    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      return res.status(400).json({
        mensaje: 'El monto a retirar debe ser un número mayor a 0',
      });
    }

    // Validación 3: Longitud de descripción
    if (descripcion && descripcion.length > 100) {
      return res.status(400).json({
        mensaje: 'La descripción no puede superar los 100 caracteres',
      });
    }

    // Buscar la cuenta
    const cuenta = await buscarCuentaPorIdONumero(cuentaId);
    if (!cuenta) {
      return res.status(404).json({ mensaje: 'Cuenta no encontrada' });
    }

    // Validación 4: Verificación preliminar de fondos suficientes
    if (cuenta.saldo < montoNumerico) {
      return res.status(400).json({
        mensaje: `Saldo insuficiente para realizar el retiro. Saldo disponible: $${cuenta.saldo.toFixed(
          2
        )}`,
      });
    }

    // Actualización atómica con precondición (saldo >= montoNumerico)
    // Esto previene race conditions y garantiza que NUNCA quede saldo negativo
    const cuentaActualizada = await Cuenta.findOneAndUpdate(
      { _id: cuenta._id, saldo: { $gte: montoNumerico } },
      { $inc: { saldo: -montoNumerico } },
      { new: true, runValidators: true }
    );

    if (!cuentaActualizada) {
      return res.status(400).json({
        mensaje: 'Saldo insuficiente o transacción simultánea en curso',
      });
    }

    // Registro de la transacción de retiro
    const transaccion = await Transaccion.create({
      cuentaId: cuentaActualizada._id,
      tipo: 'RETIRO',
      monto: montoNumerico,
      saldoPosterior: cuentaActualizada.saldo,
      descripcion: (descripcion || 'Retiro de efectivo').trim(),
    });

    return res.status(200).json({
      mensaje: 'Retiro realizado con éxito',
      cuenta: cuentaActualizada,
      transaccion,
    });
  } catch (error) {
    console.error('Error en retiro:', error);
    return res.status(500).json({
      mensaje: 'Error interno del servidor al procesar el retiro',
      error: error.message,
    });
  }
};

/**
 * POST /api/cuenta/transferencia
 * Transfiere fondos entre dos cuentas de forma atómica y consistente.
 * Body: { cuentaOrigenId, cuentaDestinoId, monto, descripcion }
 */
const realizarTransferencia = async (req, res) => {
  try {
    const { cuentaOrigenId, cuentaDestinoId, monto, descripcion } = req.body;

    // Validación 1: Campos obligatorios
    if (!cuentaOrigenId || !cuentaDestinoId || monto === undefined || monto === null) {
      return res.status(400).json({
        mensaje: 'La cuenta origen, cuenta destino y monto son obligatorios',
      });
    }

    // Validación 2: Monto numérico mayor a 0
    const montoNumerico = Number(parseFloat(monto).toFixed(2));
    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      return res.status(400).json({
        mensaje: 'El monto a transferir debe ser un número mayor a 0',
      });
    }

    // Validación 3: Longitud de descripción
    if (descripcion && descripcion.length > 100) {
      return res.status(400).json({
        mensaje: 'La descripción no puede superar los 100 caracteres',
      });
    }

    // Buscar ambas cuentas
    const cuentaOrigen = await buscarCuentaPorIdONumero(cuentaOrigenId);
    if (!cuentaOrigen) {
      return res.status(404).json({ mensaje: 'Cuenta de origen no encontrada' });
    }

    const cuentaDestino = await buscarCuentaPorIdONumero(cuentaDestinoId);
    if (!cuentaDestino) {
      return res.status(404).json({ mensaje: 'Cuenta de destino no encontrada' });
    }

    // Validación 4: No permitir transferencias a la misma cuenta
    if (cuentaOrigen._id.toString() === cuentaDestino._id.toString()) {
      return res.status(400).json({
        mensaje: 'No se puede transferir fondos a la misma cuenta de origen',
      });
    }

    // Validación 5: Saldo suficiente en origen
    if (cuentaOrigen.saldo < montoNumerico) {
      return res.status(400).json({
        mensaje: `Saldo insuficiente en la cuenta de origen. Saldo disponible: $${cuentaOrigen.saldo.toFixed(
          2
        )}`,
      });
    }

    // Actualización consistente:
    // 1) Debitar de origen asegurando atómicamente saldo >= montoNumerico
    const origenActualizado = await Cuenta.findOneAndUpdate(
      { _id: cuentaOrigen._id, saldo: { $gte: montoNumerico } },
      { $inc: { saldo: -montoNumerico } },
      { new: true }
    );

    if (!origenActualizado) {
      return res.status(400).json({
        mensaje: 'Saldo insuficiente en la cuenta de origen para transferir',
      });
    }

    // 2) Acreditar en destino
    let destinoActualizado;
    try {
      destinoActualizado = await Cuenta.findByIdAndUpdate(
        cuentaDestino._id,
        { $inc: { saldo: montoNumerico } },
        { new: true }
      );
    } catch (creditoError) {
      // Revertir débito en caso de fallo inesperado (compensating transaction)
      await Cuenta.findByIdAndUpdate(cuentaOrigen._id, {
        $inc: { saldo: montoNumerico },
      });
      throw creditoError;
    }

    const descFinal = (descripcion || 'Transferencia entre cuentas').trim();

    // 3) Registrar transacciones en el historial de ambas partes
    const transaccionOrigen = await Transaccion.create({
      cuentaId: origenActualizado._id,
      tipo: 'TRANSFERENCIA_ENVIADA',
      monto: montoNumerico,
      saldoPosterior: origenActualizado.saldo,
      cuentaDestinoId: destinoActualizado._id,
      descripcion: `${descFinal} (Destino: ${cuentaDestino.titular} - ${cuentaDestino.numeroCuenta})`,
    });

    await Transaccion.create({
      cuentaId: destinoActualizado._id,
      tipo: 'TRANSFERENCIA_RECIBIDA',
      monto: montoNumerico,
      saldoPosterior: destinoActualizado.saldo,
      cuentaDestinoId: origenActualizado._id,
      descripcion: `${descFinal} (Origen: ${cuentaOrigen.titular} - ${cuentaOrigen.numeroCuenta})`,
    });

    return res.status(200).json({
      mensaje: 'Transferencia realizada con éxito',
      cuentaOrigen: origenActualizado,
      cuentaDestino: destinoActualizado,
      transaccion: transaccionOrigen,
    });
  } catch (error) {
    console.error('Error en transferencia:', error);
    return res.status(500).json({
      mensaje: 'Error interno del servidor al procesar la transferencia',
      error: error.message,
    });
  }
};

/**
 * GET /api/cuenta/:id/historial
 * Obtiene el registro de transacciones de una cuenta ordenadas de la más reciente a la más antigua.
 */
const obtenerHistorial = async (req, res) => {
  try {
    const { id } = req.params;
    const cuenta = await buscarCuentaPorIdONumero(id);

    if (!cuenta) {
      return res.status(404).json({ mensaje: 'Cuenta no encontrada' });
    }

    const transacciones = await Transaccion.find({ cuentaId: cuenta._id })
      .sort({ fecha: -1 })
      .populate('cuentaDestinoId', 'titular numeroCuenta');

    return res.status(200).json(transacciones);
  } catch (error) {
    console.error('Error al obtener historial:', error);
    return res.status(500).json({
      mensaje: 'Error interno del servidor al consultar el historial',
      error: error.message,
    });
  }
};

module.exports = {
  obtenerTodasLasCuentas,
  obtenerCuentaPorId,
  realizarDeposito,
  realizarRetiro,
  realizarTransferencia,
  obtenerHistorial,
};

