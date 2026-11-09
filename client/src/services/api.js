/**
 * ============================================================================
 * SERVICIO CENTRALIZADO DE API (Fetch Helper)
 * ============================================================================
 * Centraliza las peticiones HTTP al backend de Express.
 * Gracias al proxy configurado en Vite, podemos usar rutas relativas '/api'.
 */

const BASE_URL = '/api';

/**
 * Función auxiliar genérica para procesar respuestas HTTP y capturar errores.
 */
const manejarRespuesta = async (response) => {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Si el backend respondió con 400, 404 o 500, lanzamos un error con su mensaje
    const mensajeError =
      data.mensaje || `Error en la solicitud (Código HTTP ${response.status})`;
    throw new Error(mensajeError);
  }

  return data;
};

// 1. Obtener todas las cuentas registradas (para el selector)
export const obtenerCuentas = async () => {
  const res = await fetch(`${BASE_URL}/cuentas`);
  return manejarRespuesta(res);
};

// 2. Obtener los datos y saldo de una cuenta por su ID o número de cuenta
export const obtenerCuentaPorId = async (id) => {
  const res = await fetch(`${BASE_URL}/cuenta/${id}`);
  return manejarRespuesta(res);
};

// 3. Registrar un depósito
export const realizarDeposito = async ({ cuentaId, monto, descripcion }) => {
  const res = await fetch(`${BASE_URL}/cuenta/deposito`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cuentaId, monto, descripcion }),
  });
  return manejarRespuesta(res);
};

// 4. Registrar un retiro
export const realizarRetiro = async ({ cuentaId, monto, descripcion }) => {
  const res = await fetch(`${BASE_URL}/cuenta/retiro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cuentaId, monto, descripcion }),
  });
  return manejarRespuesta(res);
};

// 5. Registrar una transferencia entre cuentas
export const realizarTransferencia = async ({
  cuentaOrigenId,
  cuentaDestinoId,
  monto,
  descripcion,
}) => {
  const res = await fetch(`${BASE_URL}/cuenta/transferencia`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cuentaOrigenId,
      cuentaDestinoId,
      monto,
      descripcion,
    }),
  });
  return manejarRespuesta(res);
};

// 6. Obtener el historial de transacciones de una cuenta
export const obtenerHistorial = async (id) => {
  const res = await fetch(`${BASE_URL}/cuenta/${id}/historial`);
  return manejarRespuesta(res);
};

