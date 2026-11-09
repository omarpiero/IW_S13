const mongoose = require('mongoose');

/**
 * Esquema de Transacción Bancaria
 * Registra cada operación realizada (depósitos, retiros y transferencias),
 * preservando el monto, tipo de movimiento, saldo resultante y fecha.
 */
const TransaccionSchema = new mongoose.Schema(
  {
    cuentaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cuenta',
      required: [true, 'El identificador de la cuenta es obligatorio'],
      index: true, // Optimiza búsquedas en el historial de la cuenta
    },
    tipo: {
      type: String,
      enum: {
        values: [
          'DEPOSITO',
          'RETIRO',
          'TRANSFERENCIA_ENVIADA',
          'TRANSFERENCIA_RECIBIDA',
        ],
        message: '{VALUE} no es un tipo de transacción admitido',
      },
      required: [true, 'El tipo de transacción es obligatorio'],
    },
    monto: {
      type: Number,
      required: [true, 'El monto de la transacción es obligatorio'],
      min: [0.01, 'El monto debe ser mayor a 0'],
    },
    saldoPosterior: {
      type: Number,
      required: [true, 'El saldo posterior es obligatorio para auditoría'],
    },
    cuentaDestinoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cuenta',
      default: null, // Solo aplica en transferencias
    },
    descripcion: {
      type: String,
      trim: true,
      maxlength: [100, 'La descripción no puede superar los 100 caracteres'],
      default: '',
    },
    fecha: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = mongoose.model('Transaccion', TransaccionSchema, 'transacciones');

