const BASE_URL = "http://127.0.0.1:8000";

export const enviarMensaje = async (mensaje: string) => {
  const res = await fetch(`${BASE_URL}/asistente/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mensaje }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `Error ${res.status}`);
  }

  return res.json() as Promise<{ respuesta: string }>;
};