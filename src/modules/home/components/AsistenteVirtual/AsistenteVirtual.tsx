import { useState, useRef, useEffect, useCallback } from "react";
import style from "./AsistenteVirtual.module.css";
import { images } from "../../../../assets/img/index";
import { supabase } from "../../../../lib/supabase";

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Conversacion {
  mensajeid: number;
  mensajeentrada: string;
  mensajesalida: string | null;
  recomendarproducto?: ProductoRecomendado[];
}

interface ProductoRecomendado {
  recomendarproductoid: number;
  recomendarproductonombre: string;
  imagen_url: string | null;
}

// ── Componente ────────────────────────────────────────────────────────────────
const AsistenteVirtual = () => {
  const [open, setOpen]           = useState(false);
  const [mensaje, setMensaje]     = useState("");
  const [enviando, setEnviando]   = useState(false);
  const [cargando, setCargando]   = useState(false);
  const [historial, setHistorial] = useState<Conversacion[]>([]);

  const [historialconversacionid, setHistorialconversacionid] = useState<number | null>(null);
  const convIdRef = useRef<number | null>(null);

  const bodyRef = useRef<HTMLDivElement>(null);

  // ── Sincronizar ref con state ──────────────────────────────────────────────
  useEffect(() => {
    convIdRef.current = historialconversacionid;
  }, [historialconversacionid]);

  // ── Obtener URL pública del bucket ─────────────────────────────────────────
  const obtenerImagenUrl = (rutaBucket: string | null): string | null => {
    if (!rutaBucket) return null;
    const { data } = supabase.storage
      .from("imagenes")
      .getPublicUrl(`producto/${rutaBucket}`);
    return data?.publicUrl ?? null;
  };

  // ── Buscar productos recomendados por mensajeid ────────────────────────────
  const fetchProductosRecomendados = async (
    mensajeid: number
  ): Promise<ProductoRecomendado[]> => {
    const { data: recomendados } = await supabase
      .from("recomendar_producto")
      .select("recomendarproductoid, recomendarproductonombre")
      .eq("mensajeid", mensajeid);                  // ✅ antes era asistenteid

    if (!recomendados || recomendados.length === 0) return [];

    const resultados: ProductoRecomendado[] = [];

    for (const rec of recomendados) {
      const { data: producto } = await supabase
        .from("producto")
        .select("prdcimgnombrebucket")
        .eq("prdcnombre", rec.recomendarproductonombre)
        .single();

      resultados.push({
        recomendarproductoid: rec.recomendarproductoid,
        recomendarproductonombre: rec.recomendarproductonombre,
        imagen_url: producto ? obtenerImagenUrl(producto.prdcimgnombrebucket) : null,
      });
    }

    return resultados;
  };

  // ── Cargar historial completo ──────────────────────────────────────────────
  const fetchHistorial = useCallback(async (convId: number) => {
    const { data } = await supabase
      .from("mensaje")                              // ✅ antes era asistente
      .select("mensajeid, mensajeentrada, mensajesalida")
      .eq("historialconversacionid", convId)
      .order("mensajeid", { ascending: true });     // ✅ antes era asistenteid

    if (!data) return;

    const historialConProductos: Conversacion[] = await Promise.all(
      data.map(async (conv) => {
        const productos = conv.mensajesalida
          ? await fetchProductosRecomendados(conv.mensajeid)
          : [];
        return { ...conv, recomendarproducto: productos };
      })
    );

    setHistorial(historialConProductos);
  }, []);

  // ── Polling cada 3 segundos ────────────────────────────────────────────────
  useEffect(() => {
    if (!open || !historialconversacionid) return;

    const id = convIdRef.current;
    if (id) fetchHistorial(id);

    const intervalo = setInterval(() => {
      const id = convIdRef.current;
      if (id) fetchHistorial(id);
    }, 3000);

    return () => clearInterval(intervalo);
  }, [open, historialconversacionid, fetchHistorial]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [historial]);

  // ── Abrir chat ────────────────────────────────────────────────────────────
  const handleAbrir = async () => {
    if (open) return;

    setCargando(true);
    setHistorial([]);

    const { data, error } = await supabase
      .from("historial_conversacion")
      .insert({ historialtitulo: "nueva conversación" })
      .select("historialconversacionid")
      .single();

    if (!error && data) {
      const nuevoId = data.historialconversacionid;

      convIdRef.current = nuevoId;
      await fetchHistorial(nuevoId);

      setHistorialconversacionid(nuevoId);
      setOpen(true);
    }

    setCargando(false);
  };

  // ── Cerrar chat ───────────────────────────────────────────────────────────
  const handleCerrar = () => {
    setOpen(false);
    setHistorialconversacionid(null);
    convIdRef.current = null;
    setHistorial([]);
    setMensaje("");
    setEnviando(false);
  };

  // ── Enviar mensaje ────────────────────────────────────────────────────────
  const handleEnviar = async () => {
    const texto = mensaje.trim();
    if (!texto || enviando || !historialconversacionid) return;

    const ultimoMensaje = historial[historial.length - 1];
    if (ultimoMensaje && ultimoMensaje.mensajesalida === null) return; // ✅ antes asistentesalida

    setMensaje("");
    setEnviando(true);

    await supabase.from("mensaje").insert({           // ✅ antes era asistente
      mensajeentrada: texto,                          // ✅ antes asistenteentrada
      historialconversacionid: historialconversacionid,
    });

    const id = convIdRef.current;
    if (id) await fetchHistorial(id);

    setEnviando(false);
  };

  const inputBloqueado =
    cargando ||
    enviando ||
    !historialconversacionid ||
    (historial.length > 0 &&
      historial[historial.length - 1].mensajesalida === null); // ✅ antes asistentesalida

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <button className={style.btnChat} onClick={handleAbrir}>
        💬
      </button>

      {open && (
        <div className={style.chatModal}>

          {/* HEADER */}
          <div className={style.chatHeader}>
            <div className={style.tituloContainer}>
              <div className={style.logo}>
                <img src={images.logoGorrion} alt="Logo" />
              </div>
              <div className={style.titulos}>
                <h2>Asistente Virtual</h2>
                <div className={style.subtitulo}>
                  <h1>GORRIONCITO</h1>
                </div>
              </div>
            </div>
            <button className={style.closeBtn} onClick={handleCerrar}>✖</button>
          </div>

          {/* BODY */}
          <div className={style.chatBody} ref={bodyRef}>
            <span>Asistente:</span>

            <div className={style.mensajeBot}>
              Bienvenido a Gorrioncito, tu asistente virtual. ¿En qué te podemos ayudar?
            </div>

            {historial.map((conv) => (
              <div key={conv.mensajeid}>                {/* ✅ antes asistenteid */}

                {/* Mensaje del usuario */}
                <div className={style.mensajeUser}>
                  {conv.mensajeentrada}               {/* ✅ antes asistenteentrada */}
                </div>

                {/* Respuesta o indicador de espera */}
                {conv.mensajesalida ? (               /* ✅ antes asistentesalida */
                  <>
                    <div className={style.mensajeBot}>
                      {conv.mensajesalida}
                    </div>

                    {conv.recomendarproducto &&
                      conv.recomendarproducto.filter((p) => p.imagen_url).length > 0 && (
                        <div className={style.productosRecomendados}>
                          {conv.recomendarproducto
                            .filter((prod) => prod.imagen_url)
                            .map((prod) => (
                              <img
                                key={prod.recomendarproductoid}
                                src={prod.imagen_url!}
                                alt={prod.recomendarproductonombre}
                                className={style.productoImg}
                              />
                            ))}
                        </div>
                      )}
                  </>
                ) : (
                  <div className={`${style.mensajeBot} ${style.pensando}`}>
                    <span /><span /><span />
                  </div>
                )}

              </div>
            ))}
          </div>

          {/* FOOTER */}
          <div className={style.chatFooter}>
            <input
              type="text"
              placeholder={
                cargando ? "Iniciando conversación..." : "Escribe tu mensaje..."
              }
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleEnviar(); }}
              disabled={inputBloqueado}
            />
            <button onClick={handleEnviar} disabled={inputBloqueado}>➤</button>
          </div>

        </div>
      )}
    </>
  );
};

export default AsistenteVirtual;