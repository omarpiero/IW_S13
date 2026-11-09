import React from 'react';
import { RefreshIcon } from './Icons';

/**
 * Componente SaldoCard
 * Muestra de manera prominente el saldo actual de la cuenta,
 * el titular, número de cuenta y el tipo de producto bancario.
 *
 * @param {Object} props
 * @param {Object|null} props.cuenta - Datos de la cuenta bancaria activa
 * @param {boolean} props.cargando - Indica si se está actualizando el saldo
 * @param {Function} props.onRefrescar - Función para forzar recarga manual
 */
export default function SaldoCard({ cuenta, cargando, onRefrescar }) {
  if (!cuenta) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-slate-200 rounded w-1/2"></div>
      </div>
    );
  }

  // Formateador estándar de moneda para números en formato $ 1,500.00
  const saldoFormateado = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(cuenta.saldo);

  return (
    <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-sm border border-slate-200 p-6 relative overflow-hidden">
      {/* Detalle decorativo de fondo */}
      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-purple-100/50 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
            Cuenta de {cuenta.tipoCuenta}
          </span>
          <h2 className="text-xl font-bold text-slate-800 mt-2">
            {cuenta.titular}
          </h2>
          <p className="text-xs font-mono text-slate-500 mt-0.5">
            N° de Cuenta: <span className="font-semibold text-slate-700">{cuenta.numeroCuenta}</span>
          </p>
        </div>

        <button
          onClick={onRefrescar}
          disabled={cargando}
          className="self-start sm:self-auto inline-flex items-center space-x-1.5 text-xs font-medium text-slate-600 hover:text-purple-700 bg-slate-100 hover:bg-purple-50 px-3 py-1.5 rounded-lg transition-colors border border-slate-200 disabled:opacity-50"
          title="Actualizar saldo"
        >
          <RefreshIcon className={`w-3.5 h-3.5 text-slate-500 ${cargando ? 'animate-spin text-purple-600' : ''}`} />
          <span>{cargando ? 'Actualizando...' : 'Actualizar'}</span>
        </button>
      </div>

      <div>
        <span className="text-xs font-medium text-slate-500 block mb-1">
          Saldo Disponible
        </span>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {saldoFormateado}
          </span>
        </div>
      </div>
    </div>
  );
}
