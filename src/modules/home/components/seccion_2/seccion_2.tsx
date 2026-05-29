import { useEffect, useRef, useState, useCallback } from "react";
import style from "./seccion_2.module.css";
import { Link, useNavigate } from "react-router-dom";
import {
  listarCategorias,
  getImagenCategoria,
} from "../../../../core/services/categoria.service";
import type { Categoria } from "../../../../core/types";

// ─── Constantes ───────────────────────────────────────────────────────────────

const LIMITE_POR_PAGINA  = 9;
const TARJETAS_VISIBLES  = 3;
const LIMITE_MOBILE      = 12;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildDisplayName(raw: string | null | undefined, fallback: string): string {
  if (!raw) return fallback;
  const base       = raw.replace(/\.[^.]+$/, "");
  const normalized = base.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return normalized
    ? normalized.replace(/\b\w/g, (c) => c.toUpperCase())
    : fallback;
}

function mapearCategoria(cat: Categoria) {
  return {
    id:     cat.ctgraid,
    titulo: buildDisplayName(cat.ctgranombre, `Categoría ${cat.ctgraid}`),
    imagen: cat.ctgraimgnombrebucket ? getImagenCategoria(cat.ctgraimgnombrebucket) : "",
  };
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

type CategoriaUI = ReturnType<typeof mapearCategoria>;

// ─── Componente ───────────────────────────────────────────────────────────────

const Seccion_2 = () => {
  const navigate = useNavigate();

  const [tarjetas,  setTarjetas]  = useState<CategoriaUI[]>([]);
  const [inicio,    setInicio]    = useState(0);
  const [cargando,  setCargando]  = useState(false);
  const [hayMas,    setHayMas]    = useState(true);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // ── Carga paginada ────────────────────────────────────────────────────────

  const cargarPagina = useCallback(async (numeroPagina: number) => {
    if (cargando || !hayMas) return;
    setCargando(true);
    try {
      const datos = await listarCategorias(numeroPagina, LIMITE_POR_PAGINA);
      if (datos.length === 0) { setHayMas(false); return; }
      setTarjetas((prev) => [...prev, ...datos.map(mapearCategoria)]);
      if (datos.length < LIMITE_POR_PAGINA) setHayMas(false);
    } catch (err) {
      console.error("Error al cargar categorías:", err);
      setHayMas(false);
    } finally {
      setCargando(false);
    }
  }, [cargando, hayMas]);

  useEffect(() => {
    cargarPagina(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── IntersectionObserver ──────────────────────────────────────────────────

  useEffect(() => {
    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hayMas && !cargando) {
          cargarPagina(Math.ceil(tarjetas.length / LIMITE_POR_PAGINA) + 1);
        }
      },
      { threshold: 0.1 }
    );
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [hayMas, cargando, cargarPagina, tarjetas.length]);

  // ── Slider desktop ────────────────────────────────────────────────────────

  const totalTarjetas = tarjetas.length;

  const visiblesDesktop: CategoriaUI[] =
    totalTarjetas === 0
      ? []
      : Array.from({ length: Math.min(TARJETAS_VISIBLES, totalTarjetas) }, (_, i) =>
          tarjetas[(inicio + i) % totalTarjetas]
        );

  const siguiente = () => {
    if (totalTarjetas <= 1) return;
    setInicio((prev) => (prev + 1) % totalTarjetas);
  };

  const anterior = () => {
    if (totalTarjetas <= 1) return;
    setInicio((prev) => (prev - 1 + totalTarjetas) % totalTarjetas);
  };

  // ── Mobile: primeras 12 tarjetas ──────────────────────────────────────────

  const visiblesMobile = tarjetas.slice(0, LIMITE_MOBILE);

  const irAProductos = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    navigate("/product?filtros=1");  // ← agrega ?filtros=1
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("abrirFiltros"));
    }, 300);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <section className={style.seccion}>
      <h2 className={style.tituloPrincipal}>Categorías</h2>

      {/* ── Vista desktop (slider) ── */}
      <div className={style.sliderWrap}>
        <button
          className={`${style.flecha} ${style.flechaIzquierda}`}
          type="button"
          onClick={anterior}
          aria-label="Tarjetas anteriores"
          disabled={totalTarjetas <= 1}
        >
          &#8249;
        </button>

        <div className={style.tarjetas}>
          {visiblesDesktop.length > 0 ? (
            visiblesDesktop.map((tarjeta) => (
              <article key={tarjeta.id} className={style.card}>
                <div className={style.imagenWrap}>
                  {tarjeta.imagen ? (
                    <img src={tarjeta.imagen} alt={tarjeta.titulo} className={style.imagen} loading="lazy" />
                  ) : (
                    <div className={style.placeholder}>Sin imagen</div>
                  )}
                </div>
                <div className={style.cardBody}>
                  <h3 className={style.cardTitulo}>{tarjeta.titulo}</h3>
                  <Link
                    to={`/product?categoria=${encodeURIComponent(tarjeta.titulo)}`}
                    className={style.cardLink}
                  >
                    Ver más
                  </Link>
                </div>
              </article>
            ))
          ) : (
            !cargando && <div className={style.vacio}>No hay categorías disponibles.</div>
          )}
        </div>

        <button
          className={`${style.flecha} ${style.flechaDerecha}`}
          type="button"
          onClick={siguiente}
          aria-label="Siguientes tarjetas"
          disabled={totalTarjetas <= 1}
        >
          &#8250;
        </button>
      </div>

      {/* Sentinel para infinite scroll */}
      <div ref={sentinelRef} style={{ height: 1 }} />

      {/* ── Vista mobile (lista compacta) ── */}
      <div className={style.listaMobile}>
        {visiblesMobile.map((tarjeta) => (
          <Link
            key={tarjeta.id}
            to={`/product?categoria=${encodeURIComponent(tarjeta.titulo)}`}
            className={style.cardMobile}
          >
            <div className={style.imagenMobileWrap}>
              {tarjeta.imagen ? (
                <img src={tarjeta.imagen} alt={tarjeta.titulo} className={style.imagenMobile} loading="lazy" />
              ) : (
                <div className={style.placeholderMobile} />
              )}
            </div>
            <span className={style.tituloMobile}>{tarjeta.titulo}</span>
          </Link>
        ))}

        {visiblesMobile.length > 0 && (
          <button
            type="button"
            className={style.botonVerTodos}
            onClick={irAProductos}
          >
            Ver todos los productos
          </button>
        )}
      </div>

    </section>
  );
};

export default Seccion_2;