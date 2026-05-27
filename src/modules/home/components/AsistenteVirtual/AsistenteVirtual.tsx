import { useState, useRef, useEffect, useCallback } from "react";
import style from "./AsistenteVirtual.module.css";
import { images } from "../../../../assets/img/index";
import { supabase } from "../../../../lib/supabase";

const BACKEND_URL = "http://127.0.0.1:8000";

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

const AsistenteVirtual = () => {
  const [open, setOpen]           = useState(false);
  const [mensaje, setMensaje]     = useState("");
  const [enviando, setEnviando]   = useState(false);
  const [cargando, setCargando]   = useState(false);
  const [historial, setHistorial] = useState<Conversacion[]>([]);

  const [historialconversacionid, setHistorialconversacionid] = useState<number | null>(null);
  const convIdRef = useRef<number | null>(null);
  const bodyRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    convIdRef.current = historialconversacionid;
  }, [historialconversacionid]);

  const obtenerImagenUrl = (rutaBucket: string | null): string | null => {
    if (!rutaBucket) return null;
    const { data } = supabase.storage
      .from("imagenes")
      .getPublicUrl(`producto/${rutaBucket}`);
    return data?.publicUrl ?? null;
  };

  const fetchProductosRecomendados = async (
    mensajeid: number
  ): Promise<ProductoRecomendado[]> => {
    const { data: recomendados } = await supabase
      .from("recomendar_producto")
      .select("recomendarproductoid, recomendarproductonombre")
      .eq("mensajeid", mensajeid);

    if (!recomendados || recomendados.length === 0) return [];

    const resultados: ProductoRecomendado[] = [];
    for (const rec of recomendados) {
      const { data: producto } = await supabase
        .from("producto")
        .select("prdcimgnombrebucket")
        .eq("prdcnombre", rec.recomendarproductonombre)
        .single();

      resultados.push({
        recomendarproductoid:    rec.recomendarproductoid,
        recomendarproductonombre: rec.recomendarproductonombre,
        imagen_url: producto ? obtenerImagenUrl(producto.prdcimgnombrebucket) : null,
      });
    }
    return resultados;
  };

  const fetchHistorial = useCallback(async (convId: number) => {
    const { data } = await supabase
      .from("mensaje")
      .select("mensajeid, mensajeentrada, mensajesalida")
      .eq("historialconversacionid", convId)
      .order("mensajeid", { ascending: true });

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

  // ── Polling cada 3 segundos ───────────────────────────────────────────────
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

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [historial]);

  // ── Abrir chat: crea historial con modo automático ────────────────────────
  const handleAbrir = async () => {
    if (open) return;
    setCargando(true);
    setHistorial([]);

    const { data, error } = await supabase
      .from("historial_conversacion")
      .insert({
        historialtitulo: "nueva conversación",
        modorespuesta:   "automatico",        // ✅ nuevo campo
      })
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
    if (ultimoMensaje && ultimoMensaje.mensajesalida === null) return;

    setMensaje("");
    setEnviando(true);

    // 1. Inserta el mensaje en Supabase → obtiene mensajeid
    const { data: nuevoMensaje, error } = await supabase
      .from("mensaje")
      .insert({
        mensajeentrada:          texto,
        historialconversacionid: historialconversacionid,
      })
      .select("mensajeid")
      .single();

    if (error || !nuevoMensaje) {
      setEnviando(false);
      return;
    }

    // 2. Recarga para mostrar el mensaje + loader animado
    const id = convIdRef.current;
    if (id) await fetchHistorial(id);

    // 3. Envía al backend con mensajeid + texto + historialid
    try {
      await fetch(`${BACKEND_URL}/asistente/mensaje`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensajeid:               nuevoMensaje.mensajeid,
          mensajeentrada:          texto,
          historialconversacionid: historialconversacionid,
        }),
      });

      // 4. Recarga para mostrar la respuesta del backend
      if (id) await fetchHistorial(id);

    } catch (err) {
      console.error("Error al contactar el backend:", err);
    }

    setEnviando(false);
  };

  const inputBloqueado =
    cargando ||
    enviando ||
    !historialconversacionid ||
    (historial.length > 0 &&
      historial[historial.length - 1].mensajesalida === null);

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
              <div key={conv.mensajeid}>

                <div className={style.mensajeUser}>
                  {conv.mensajeentrada}
                </div>

                {conv.mensajesalida ? (
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