import { useEffect, useRef, useState, useCallback } from "react";
import style from "./seccion_2.module.css";
import { Link } from "react-router-dom";
import {
  listarCategorias,
  getImagenCategoria,
} from "../../../../core/services/categoria.service";
import type { Categoria } from "../../../../core/types"
// ─── Constantes ────────────────────────────────────────────────────────────────
const LIMITE_POR_PAGINA = 9;
const TARJETAS_VISIBLES = 3;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Capitaliza cada palabra, quitando extensión y separadores */
function buildDisplayName(raw: string | null | undefined, fallback: string): string {
  if (!raw) return fallback;
  const baseName = raw.replace(/\.[^.]+$/, "");
  const normalized = baseName.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  if (!normalized) return fallback;
  return normalized.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Convierte una fila Categoria a la forma que usa la UI */
function mapearCategoria(cat: Categoria) {
  return {
    id: cat.ctgraid,
    titulo: buildDisplayName(cat.ctgranombre, `Categoría ${cat.ctgraid}`),
    imagen: cat.ctgraimgnombrebucket
      ? getImagenCategoria(cat.ctgraimgnombrebucket)
      : "",
  };
}

// ─── Tipos ────────────────────────────────────────────────────────────────────
type CategoriaUI = ReturnType<typeof mapearCategoria>;

// ─── Componente ───────────────────────────────────────────────────────────────
const Seccion_2 = () => {
  const [tarjetas, setTarjetas] = useState<CategoriaUI[]>([]);
  const [inicio, setInicio] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [hayMas, setHayMas] = useState(true);

  // Ref para el sentinel de IntersectionObserver
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // ── Carga de una página ────────────────────────────────────────────────────
  const cargarPagina = useCallback(async (numeroPagina: number) => {
    if (cargando || !hayMas) return;

    setCargando(true);
    try {
      const datos = await listarCategorias(numeroPagina, LIMITE_POR_PAGINA);

      if (datos.length === 0) {
        setHayMas(false);
        return;
      }

      setTarjetas((prev) => [...prev, ...datos.map(mapearCategoria)]);

      if (datos.length < LIMITE_POR_PAGINA) {
        setHayMas(false);
      }
    } catch (err) {
      console.error("Error al cargar categorías:", err);
      setHayMas(false);
    } finally {
      setCargando(false);
    }
  }, [cargando, hayMas]);

  // ── Carga inicial ─────────────────────────────────────────────────────────
  useEffect(() => {
    cargarPagina(1);
    // Solo al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── IntersectionObserver: carga la siguiente página al llegar al sentinel ──
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hayMas && !cargando) {
          setPagina((prev) => {
            const siguiente = prev + 1;
            cargarPagina(siguiente);
            return siguiente;
          });
        }
      },
      { threshold: 0.1 }
    );

    const sentinel = sentinelRef.current;
    if (sentinel) observerRef.current.observe(sentinel);

    return () => observerRef.current?.disconnect();
  }, [hayMas, cargando, cargarPagina]);

  // ── Slider ────────────────────────────────────────────────────────────────
  const totalTarjetas = tarjetas.length;
  const visibles: CategoriaUI[] =
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <section className={style.seccion}>
      <h2 className={style.tituloPrincipal}>Categorías</h2>

      <div className={style.sliderWrap}>
        {/* Flecha izquierda */}
        <button
          className={`${style.flecha} ${style.flechaIzquierda}`}
          type="button"
          onClick={anterior}
          aria-label="Tarjetas anteriores"
          disabled={totalTarjetas <= 1}
        >
          &#8249;
        </button>

        {/* Tarjetas visibles */}
        <div className={style.tarjetas}>
          {visibles.length > 0 ? (
            visibles.map((tarjeta) => (
              <article key={tarjeta.id} className={style.card}>
                <div className={style.imagenWrap}>
                  {tarjeta.imagen ? (
                    <img
                      src={tarjeta.imagen}
                      alt={tarjeta.titulo}
                      className={style.imagen}
                      loading="lazy"
                    />
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
            !cargando && (
              <div className={style.vacio}>No hay categorías disponibles.</div>
            )
          )}
        </div>

        {/* Flecha derecha */}
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

    </section>
  );
};

export default Seccion_2;