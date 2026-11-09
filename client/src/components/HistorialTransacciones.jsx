import React from 'react';
import {
  HistoryIcon,
  PlusIcon,
  MinusIcon,
  ArrowUpRightIcon,
  ArrowDownLeftIcon,
  EmptyInboxIcon,
  SpinnerIcon,
} from './Icons';

/**
 * Componente HistorialTransacciones
 * Muestra la lista de movimientos bancarios ordenados cronológicamente
 * con insignias visuales e iconos SVG según el tipo de operación.
 *
 * @param {Object} props
 * @param {Array} props.transacciones - Lista de transacciones de la cuenta activa
 * @param {boolean} props.cargando - Estado de carga
 */
export default function HistorialTransacciones({ transacciones, cargando }) {
  const formatoMoneda = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  });

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr);
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(fecha);
  };

  const renderIconoTipo = (tipo) => {
    switch (tipo) {
      case 'DEPOSITO':
        return <PlusIcon className="w-3.5 h-3.5 text-emerald-700" />;
      case 'RETIRO':
        return <MinusIcon className="w-3.5 h-3.5 text-amber-700" />;
      case 'TRANSFERENCIA_ENVIADA':
        return <ArrowUpRightIcon className="w-3.5 h-3.5 text-rose-700" />;
      case 'TRANSFERENCIA_RECIBIDA':
        return <ArrowDownLeftIcon className="w-3.5 h-3.5 text-indigo-700" />;
      default:
        return null;
    }
  };

  const obtenerConfiguracionTipo = (tipo) => {
    switch (tipo) {
      case 'DEPOSITO':
        return {
          etiqueta: 'Depósito',
          estiloBadge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          signo: '+',
          colorMonto: 'text-emerald-600',
        };
      case 'RETIRO':
        return {
          etiqueta: 'Retiro',
          estiloBadge: 'bg-amber-50 text-amber-800 border-amber-200',
          signo: '-',
          colorMonto: 'text-amber-600',
        };
      case 'TRANSFERENCIA_ENVIADA':
        return {
          etiqueta: 'Transferencia Enviada',
          estiloBadge: 'bg-rose-50 text-rose-800 border-rose-200',
          signo: '-',
          colorMonto: 'text-rose-600',
        };
      case 'TRANSFERENCIA_RECIBIDA':
        return {
          etiqueta: 'Transferencia Recibida',
          estiloBadge: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          signo: '+',
          colorMonto: 'text-indigo-600',
        };
      default:
        return {
          etiqueta: tipo,
          estiloBadge: 'bg-slate-100 text-slate-800 border-slate-200',
          signo: '',
          colorMonto: 'text-slate-800',
        };
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
          <HistoryIcon className="w-5 h-5 text-purple-700" />
          <span>Historial de Movimientos</span>
        </h3>
        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
          {transacciones.length} {transacciones.length === 1 ? 'operación' : 'operaciones'}
        </span>
      </div>

      {cargando ? (
        <div className="py-12 text-center text-slate-400">
          <SpinnerIcon className="w-6 h-6 text-purple-600 mx-auto mb-2" />
          <p className="text-xs">Cargando movimientos...</p>
        </div>
      ) : transacciones.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
          <EmptyInboxIcon className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-600">
            Aún no se registran movimientos en esta cuenta
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Realiza un depósito, retiro o transferencia para ver su detalle aquí.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                <th className="pb-3 pr-4">Operación</th>
                <th className="pb-3 px-4">Concepto / Detalle</th>
                <th className="pb-3 px-4">Fecha y Hora</th>
                <th className="pb-3 px-4 text-right">Monto</th>
                <th className="pb-3 pl-4 text-right">Saldo Posterior</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transacciones.map((tx) => {
                const config = obtenerConfiguracionTipo(tx.tipo);
                return (
                  <tr key={tx._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 pr-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.estiloBadge}`}
                      >
                        {renderIconoTipo(tx.tipo)}
                        <span>{config.etiqueta}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate">
                      {tx.descripcion || 'Sin concepto'}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-xs font-mono">
                      {formatearFecha(tx.fecha)}
                    </td>

                    <td
                      className={`py-3.5 px-4 text-right font-bold whitespace-nowrap font-mono ${config.colorMonto}`}
                    >
                      {config.signo}
                      {formatoMoneda.format(tx.monto)}
                    </td>

                    <td className="py-3.5 pl-4 text-right text-slate-600 whitespace-nowrap font-mono font-medium">
                      {tx.saldoPosterior !== undefined
                        ? formatoMoneda.format(tx.saldoPosterior)
                        : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
