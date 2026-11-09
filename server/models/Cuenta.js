const mongoose = require('mongoose');

/**
 * Esquema de Cuenta Bancaria
 * Representa una cuenta con su titular, identificador único (número de cuenta),
 * saldo actual y tipo de cuenta.
 */
const CuentaSchema = new mongoose.Schema(
  {
    titular: {
      type: String,
      required: [true, 'El nombre del titular es obligatorio'],
      trim: true,
    },
    numeroCuenta: {
      type: String,
      required: [true, 'El número de cuenta es obligatorio'],
      unique: true,
      trim: true,
    },
    saldo: {
      type: Number,
      required: [true, 'El saldo inicial es obligatorio'],
      default: 0,
      min: [0, 'El saldo no puede ser negativo'],
    },
    tipoCuenta: {
      type: String,
      enum: {
        values: ['Ahorros', 'Corriente'],
        message: '{VALUE} no es un tipo de cuenta válido',
      },
      default: 'Ahorros',
    },
  },
  {
    timestamps: true, // Crea automáticamente createdAt y updatedAt
  }
);

module.exports = mongoose.model('Cuenta', CuentaSchema, 'cuentas');

