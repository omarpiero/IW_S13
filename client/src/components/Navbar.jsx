import React from 'react';
import { BankIcon, UserIcon } from './Icons';

/**
 * Componente Navbar
 * Barra superior institucional que permite alternar la cuenta activa
 * mediante un menú desplegable conectado al estado principal.
 *
 * @param {Object} props
 * @param {Array} props.cuentas - Lista de cuentas disponibles
 * @param {Object|null} props.cuentaSeleccionada - Cuenta actualmente activa
 * @param {Function} props.onCambiarCuenta - Callback invocado al seleccionar otra cuenta
 */
export default function Navbar({ cuentas, cuentaSeleccionada, onCambiarCuenta }) {
  return (
    <header className="bg-gradient-to-r from-purple-800 to-indigo-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Identidad Institucional con SVG */}
        <div className="flex items-center space-x-3">
          <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm border border-white/10">
            <BankIcon className="w-7 h-7 text-purple-100" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Banco Simplificado</h1>
            <p className="text-xs text-purple-200">
              Ingeniería Web &bull; Gestión de Cuentas y Transacciones
            </p>
          </div>
        </div>

        {/* Selector de Cuenta Activa con SVG */}
        <div className="flex items-center space-x-3 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/10">
          <div className="flex items-center space-x-1.5 text-xs sm:text-sm font-medium text-purple-100">
            <UserIcon className="w-4 h-4 text-purple-200" />
            <label htmlFor="selector-cuenta" className="whitespace-nowrap cursor-pointer">
              Cuenta activa:
            </label>
          </div>
          <select
            id="selector-cuenta"
            value={cuentaSeleccionada?._id || ''}
            onChange={(e) => onCambiarCuenta(e.target.value)}
            className="bg-purple-950 text-white text-sm rounded-md px-3 py-1.5 border border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-300 font-medium cursor-pointer"
          >
            {cuentas.map((c) => (
              <option key={c._id} value={c._id}>
                {c.titular} ({c.numeroCuenta})
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
