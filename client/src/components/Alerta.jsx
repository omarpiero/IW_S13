import React from 'react';
import { CheckCircleIcon, AlertTriangleIcon, CloseIcon } from './Icons';

/**
 * Componente Alerta
 * Muestra mensajes de éxito (verde) o error (rojo) para dar retroalimentación
 * inmediata al usuario con iconos SVG.
 *
 * @param {Object} props
 * @param {Object|null} props.alerta - { tipo: 'exito' | 'error', mensaje: string }
 * @param {Function} props.onCerrar - Callback para cerrar la alerta
 */
export default function Alerta({ alerta, onCerrar }) {
  if (!alerta || !alerta.mensaje) return null;

  const esExito = alerta.tipo === 'exito';

  return (
    <div
      className={`flex items-center justify-between p-4 mb-6 rounded-xl border shadow-sm transition-all ${
        esExito
          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
          : 'bg-rose-50 border-rose-200 text-rose-900'
      }`}
      role="alert"
    >
      <div className="flex items-center space-x-3">
        {esExito ? (
          <CheckCircleIcon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
        ) : (
          <AlertTriangleIcon className="w-5 h-5 text-rose-600 flex-shrink-0" />
        )}
        <div className="text-sm font-medium">
          <strong className="block font-semibold">
            {esExito ? 'Operación Exitosa' : 'Atención'}
          </strong>
          <span>{alerta.mensaje}</span>
        </div>
      </div>
      <button
        onClick={onCerrar}
        className={`ml-4 p-1 rounded-md hover:bg-black/10 transition-colors ${
          esExito ? 'text-emerald-700' : 'text-rose-700'
        }`}
        title="Cerrar notificación"
      >
        <CloseIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
