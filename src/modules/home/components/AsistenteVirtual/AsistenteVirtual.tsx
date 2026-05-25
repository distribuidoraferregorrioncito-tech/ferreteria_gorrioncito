import { useState, useRef, useEffect, useCallback } from "react";
import style from "./AsistenteVirtual.module.css";
import { images } from "../../../../assets/img/index";
import { supabase } from "../../../../lib/supabase";

interface Conversacion {
  asistenteid: number;
  asistenteentrada: string;
  asistentesalida: string | null;
  recomendarproducto?: ProductoRecomendado[];
}

interface ProductoRecomendado {
  recomendarproductoid: number;
  recomendarproductonombre: string;
  imagen_url: string | null;
}

const AsistenteVirtual = () => {
  const [open, setOpen]                           = useState(false);
  const [mensaje, setMensaje]                     = useState("");
  const [enviando, setEnviando]                   = useState(false);
  const [cargando, setCargando]                   = useState(false);
  const [historial, setHistorial]                 = useState<Conversacion[]>([]);
  const [historialConversacionId, setHistorialConversacionId] = useState<number | null>(null);
  const bodyRef        = useRef<HTMLDivElement>(null);
  const convIdRef      = useRef<number | null>(null); // ✅ siempre actualizado

  // ── Sincronizar ref con state ─────────────────────────────
  useEffect(() => {
    convIdRef.current = historialConversacionId;
  }, [historialConversacionId]);

  // ── Obtener imagen pública del bucket ─────────────────────
  const obtenerImagenUrl = (rutaBucket: string | null): string | null => {
    if (!rutaBucket) return null;
    const { data } = supabase.storage
      .from("productos")
      .getPublicUrl(rutaBucket);
    return data?.publicUrl ?? null;
  };

  // ── Buscar productos recomendados ─────────────────────────
  const fetchProductosRecomendados = async (
    asistenteid: number
  ): Promise<ProductoRecomendado[]> => {
    const { data: recomendados } = await supabase
      .from("recomendar_producto")
      .select("recomendarproductoid, recomendarproductonombre")
      .eq("asistenteid", asistenteid);

    if (!recomendados || recomendados.length === 0) return [];

    const resultados: ProductoRecomendado[] = [];

    for (const rec of recomendados) {
      const { data: producto } = await supabase
        .from("producto")
        .select("prdcimgnombrebucket")
        .eq("prdcnombre", rec.recomendarproductonombre)
        .single();

      const imagen_url = producto
        ? obtenerImagenUrl(producto.prdcimgnombrebucket)
        : null;

      if (imagen_url) {
        resultados.push({
          recomendarproductoid: rec.recomendarproductoid,
          recomendarproductonombre: rec.recomendarproductonombre,
          imagen_url,
        });
      }
    }

    return resultados;
  };

  // ── Cargar historial ──────────────────────────────────────
  // useCallback para que no cambie referencia en cada render
  const fetchHistorial = useCallback(async (convId: number) => {
    const { data } = await supabase
      .from("asistente")
      .select("asistenteid, asistenteentrada, asistentesalida")
      .eq("historialconversacionid", convId)
      .order("asistenteid", { ascending: true });

    if (!data) return;

    const historialConProductos: Conversacion[] = await Promise.all(
      data.map(async (conv) => {
        const productos = conv.asistentesalida
          ? await fetchProductosRecomendados(conv.asistenteid)
          : [];
        return { ...conv, recomendarproducto: productos };
      })
    );

    setHistorial(historialConProductos);
  }, []);

  // ── Realtime ──────────────────────────────────────────────
  useEffect(() => {
    if (!open || !historialConversacionId) return;

    fetchHistorial(historialConversacionId);

    const canal = supabase
      .channel(`historial-asistente-${historialConversacionId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "asistente" },
        () => {
          const id = convIdRef.current; // ✅ siempre tiene el valor real
          if (id) fetchHistorial(id);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "asistente" },
        (payload) => {
          // ✅ Solo recargar si el UPDATE trae asistentesalida relleno
          const nuevo = payload.new as { asistentesalida: string | null };
          if (nuevo.asistentesalida) {
            const id = convIdRef.current;
            if (id) fetchHistorial(id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [open, historialConversacionId, fetchHistorial]);

  // ── Auto-scroll ───────────────────────────────────────────
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [historial]);

  // ── Abrir chat ────────────────────────────────────────────
  const handleAbrir = async () => {
    if (open) return;

    setOpen(true);
    setCargando(true);
    setHistorial([]);
    setHistorialConversacionId(null);

    const { data, error } = await supabase
      .from("historial_conversacion")
      .insert({ historialtitulo: "Nueva conversación" })
      .select("historialconversacionid")
      .single();

    if (!error && data) {
      setHistorialConversacionId(data.historialconversacionid);
    }

    setCargando(false);
  };

  // ── Cerrar chat ───────────────────────────────────────────
  const handleCerrar = () => {
    setOpen(false);
    setHistorialConversacionId(null);
    convIdRef.current = null;
    setHistorial([]);
    setMensaje("");
    setEnviando(false);
  };

  // ── Enviar mensaje ────────────────────────────────────────
  const handleEnviar = async () => {
    const texto = mensaje.trim();
    if (!texto || enviando || !historialConversacionId) return;

    const ultimoMensaje = historial[historial.length - 1];
    if (ultimoMensaje && ultimoMensaje.asistentesalida === null) return;

    setMensaje("");
    setEnviando(true);

    await supabase
      .from("asistente")
      .insert({
        asistenteentrada: texto,
        historialconversacionid: historialConversacionId,
      });

    setEnviando(false);
  };

  const inputBloqueado =
    cargando ||
    enviando ||
    !historialConversacionId ||
    (historial.length > 0 && historial[historial.length - 1].asistentesalida === null);

  return (
    <>
      <button className={style.btnChat} onClick={handleAbrir}>
        💬
      </button>

      {open && (
        <div className={style.chatModal}>

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

          <div className={style.chatBody} ref={bodyRef}>
            <span>Asistente:</span>

            <div className={style.mensajeBot}>
              Bienvenido a Gorrioncito, tu asistente virtual. ¿En qué te podemos ayudar?
            </div>

            {historial.map((conv) => (
              <div key={conv.asistenteid}>
                <div className={style.mensajeUser}>
                  {conv.asistenteentrada}
                </div>

                {conv.asistentesalida ? (
                  <>
                    <div className={style.mensajeBot}>
                      {conv.asistentesalida}
                    </div>

                    {conv.recomendarproducto && conv.recomendarproducto.length > 0 && (
                      <div className={style.productosRecomendados}>
                        {conv.recomendarproducto.map((prod) => (
                          <div key={prod.recomendarproductoid} className={style.productoCard}>
                            <img
                              src={prod.imagen_url!}
                              alt={prod.recomendarproductonombre}
                              className={style.productoImg}
                            />
                            <p className={style.productoNombre}>
                              {prod.recomendarproductonombre}
                            </p>
                          </div>
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

          <div className={style.chatFooter}>
            <input
              type="text"
              placeholder={cargando ? "Iniciando conversación..." : "Escribe tu mensaje..."}
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