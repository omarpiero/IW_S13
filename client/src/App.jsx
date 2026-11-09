import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import SaldoCard from './components/SaldoCard';
import FormOperacion from './components/FormOperacion';
import HistorialTransacciones from './components/HistorialTransacciones';
import Alerta from './components/Alerta';
import {
  obtenerCuentas,
  obtenerCuentaPorId,
  obtenerHistorial,
} from './services/api';

/**
 * ============================================================================
 * COMPONENTE PRINCIPAL: App
 * ============================================================================
 * Orquestador central de la aplicación bancaria.
 */
export default function App() {
  const [cuentas, setCuentas] = useState([]);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [alerta, setAlerta] = useState(null);

  const cargarCuentas = async () => {
    try {
      setCargando(true);
      const lista = await obtenerCuentas();
      setCuentas(lista);

      if (lista.length > 0 && !cuentaSeleccionada) {
        setCuentaSeleccionada(lista[0]);
      }
    } catch (err) {
      setAlerta({
        tipo: 'error',
        mensaje: `No se pudo conectar con el servidor: ${err.message}. Asegúrate de que el backend esté ejecutándose en el puerto 5000.`,
      });
    } finally {
      setCargando(false);
    }
  };

  const refrescarCuentaActiva = useCallback(
    async (cuentaId) => {
      const idABuscar = cuentaId || cuentaSeleccionada?._id;
      if (!idABuscar) return;

      try {
        setCargando(true);
        const [cuentaActualizada, transacciones] = await Promise.all([
          obtenerCuentaPorId(idABuscar),
          obtenerHistorial(idABuscar),
        ]);

        setCuentaSeleccionada(cuentaActualizada);
        setHistorial(transacciones);

        setCuentas((prevCuentas) =>
          prevCuentas.map((c) =>
            c._id === cuentaActualizada._id ? cuentaActualizada : c
          )
        );
      } catch (err) {
        setAlerta({
          tipo: 'error',
          mensaje: `Error al actualizar datos de la cuenta: ${err.message}`,
        });
      } finally {
        setCargando(false);
      }
    },
    [cuentaSeleccionada?._id]
  );

  useEffect(() => {
    cargarCuentas();
  }, []);

  useEffect(() => {
    if (cuentaSeleccionada?._id) {
      refrescarCuentaActiva(cuentaSeleccionada._id);
    }
  }, [cuentaSeleccionada?._id, refrescarCuentaActiva]);

  const handleCambiarCuenta = (nuevoId) => {
    const cuentaEncontrada = cuentas.find((c) => c._id === nuevoId);
    if (cuentaEncontrada) {
      setCuentaSeleccionada(cuentaEncontrada);
      setAlerta(null);
    }
  };

  const handleOperacionExitosa = async (mensajeExito) => {
    setAlerta({ tipo: 'exito', mensaje: mensajeExito });
    await refrescarCuentaActiva(cuentaSeleccionada._id);
  };

  const handleError = (mensajeError) => {
    setAlerta({ tipo: 'error', mensaje: mensajeError });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* 1. Barra de Navegación */}
      <Navbar
        cuentas={cuentas}
        cuentaSeleccionada={cuentaSeleccionada}
        onCambiarCuenta={handleCambiarCuenta}
      />

      {/* 2. Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner de Alertas / Notificaciones */}
        <Alerta alerta={alerta} onCerrar={() => setAlerta(null)} />

        {/* Fila Superior: Saldo Disponible y Formulario de Operaciones */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Tarjeta de Saldo */}
          <div className="lg:col-span-5">
            <SaldoCard
              cuenta={cuentaSeleccionada}
              cargando={cargando}
              onRefrescar={() => refrescarCuentaActiva(cuentaSeleccionada?._id)}
            />
          </div>

          {/* Formulario de Operaciones */}
          <div className="lg:col-span-7">
            <FormOperacion
              cuentaOrigen={cuentaSeleccionada}
              cuentasDisponibles={cuentas}
              onOperacionExitosa={handleOperacionExitosa}
              onError={handleError}
            />
          </div>
        </div>

        {/* Fila Inferior: Historial de Transacciones */}
        <HistorialTransacciones
          transacciones={historial}
          cargando={cargando}
        />
      </main>

      {/* Pie de Página Institucional */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-700">
          Ingeniería Web &bull; Trabajo Práctico: Sistema de Gestión de Cuenta Bancaria Simplificada
        </p>
        <p className="mt-1">
          Stack: Node.js &bull; Express &bull; MongoDB &bull; React + Vite &bull; Tailwind CSS
        </p>
      </footer>
    </div>
  );
}
