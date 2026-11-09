import React, { useState } from 'react';
import {
  realizarDeposito,
  realizarRetiro,
  realizarTransferencia,
} from '../services/api';
import {
  OperationIcon,
  PlusIcon,
  MinusIcon,
  TransferIcon,
  SpinnerIcon,
} from './Icons';

/**
 * Componente FormOperacion
 * Proporciona una interfaz con pestañas para ejecutar las tres operaciones
 * bancarias principales (Depósito, Retiro y Transferencia).
 *
 * @param {Object} props
 * @param {Object} props.cuentaOrigen - Cuenta activa desde la que se opera
 * @param {Array} props.cuentasDisponibles - Todas las cuentas (para el selector de destino)
 * @param {Function} props.onOperacionExitosa - Callback para refrescar datos y notificar éxito
 * @param {Function} props.onError - Callback para notificar error
 */
export default function FormOperacion({
  cuentaOrigen,
  cuentasDisponibles,
  onOperacionExitosa,
  onError,
}) {
  const [tabActiva, setTabActiva] = useState('deposito');
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [cuentaDestinoId, setCuentaDestinoId] = useState('');
  const [procesando, setProcesando] = useState(false);

  const cuentasDestinoPosibles = cuentasDisponibles.filter(
    (c) => c._id !== cuentaOrigen?._id
  );

  const limpiarFormulario = () => {
    setMonto('');
    setDescripcion('');
    setCuentaDestinoId('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      onError('Por favor ingresa un monto válido mayor a $0.00');
      return;
    }

    if ((tabActiva === 'retiro' || tabActiva === 'transferencia') && montoNum > cuentaOrigen.saldo) {
      onError(
        `Saldo insuficiente. Intentas operar por $${montoNum.toFixed(
          2
        )} pero tu saldo disponible es de $${cuentaOrigen.saldo.toFixed(2)}`
      );
      return;
    }

    if (tabActiva === 'transferencia') {
      if (!cuentaDestinoId) {
        onError('Por favor selecciona una cuenta de destino para transferir');
        return;
      }
      if (cuentaDestinoId === cuentaOrigen._id) {
        onError('No puedes transferir fondos a tu misma cuenta');
        return;
      }
    }

    setProcesando(true);

    try {
      let resultado;

      if (tabActiva === 'deposito') {
        resultado = await realizarDeposito({
          cuentaId: cuentaOrigen._id,
          monto: montoNum,
          descripcion,
        });
      } else if (tabActiva === 'retiro') {
        resultado = await realizarRetiro({
          cuentaId: cuentaOrigen._id,
          monto: montoNum,
          descripcion,
        });
      } else if (tabActiva === 'transferencia') {
        resultado = await realizarTransferencia({
          cuentaOrigenId: cuentaOrigen._id,
          cuentaDestinoId,
          monto: montoNum,
          descripcion,
        });
      }

      limpiarFormulario();
      onOperacionExitosa(resultado.mensaje || 'Operación completada con éxito');
    } catch (err) {
      onError(err.message || 'Error al procesar la operación bancaria');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center space-x-2">
        <OperationIcon className="w-5 h-5 text-purple-700" />
        <span>Operaciones Bancarias</span>
      </h3>

      {/* Selector de Pestañas con Iconos SVG */}
      <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl mb-6">
        <button
          type="button"
          onClick={() => {
            setTabActiva('deposito');
            limpiarFormulario();
          }}
          className={`py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
            tabActiva === 'deposito'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <PlusIcon className="w-4 h-4 text-emerald-600" />
          <span>Depositar</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setTabActiva('retiro');
            limpiarFormulario();
          }}
          className={`py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
            tabActiva === 'retiro'
              ? 'bg-white text-amber-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MinusIcon className="w-4 h-4 text-amber-600" />
          <span>Retirar</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setTabActiva('transferencia');
            limpiarFormulario();
          }}
          className={`py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
            tabActiva === 'transferencia'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TransferIcon className="w-4 h-4 text-indigo-600" />
          <span>Transferir</span>
        </button>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {tabActiva === 'transferencia' && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cuenta Destino *
            </label>
            <select
              value={cuentaDestinoId}
              onChange={(e) => setCuentaDestinoId(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              required
            >
              <option value="">-- Selecciona una cuenta destino --</option>
              {cuentasDestinoPosibles.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.titular} &bull; {c.numeroCuenta} ({c.tipoCuenta})
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Monto a {tabActiva === 'deposito' ? 'depositar' : tabActiva === 'retiro' ? 'retirar' : 'transferir'} ($ USD) *
          </label>
          <div className="relative rounded-lg shadow-sm">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-sm">
              $
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 pl-8 pr-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono font-medium"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Concepto o Nota (Opcional, máx 100 caracteres)
          </label>
          <input
            type="text"
            maxLength={100}
            placeholder={
              tabActiva === 'deposito'
                ? 'Ej: Depósito de nómina'
                : tabActiva === 'retiro'
                ? 'Ej: Retiro para gastos'
                : 'Ej: Pago de servicios'
            }
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <button
          type="submit"
          disabled={procesando}
          className={`w-full py-2.5 px-4 rounded-xl text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center space-x-2 ${
            procesando
              ? 'bg-slate-400 cursor-not-allowed'
              : tabActiva === 'deposito'
              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
              : tabActiva === 'retiro'
              ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
          }`}
        >
          {procesando ? (
            <>
              <SpinnerIcon className="w-4 h-4 text-white" />
              <span>Procesando transacción...</span>
            </>
          ) : (
            <>
              <span>
                {tabActiva === 'deposito'
                  ? 'Confirmar Depósito'
                  : tabActiva === 'retiro'
                  ? 'Confirmar Retiro'
                  : 'Confirmar Transferencia'}
              </span>
              <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
