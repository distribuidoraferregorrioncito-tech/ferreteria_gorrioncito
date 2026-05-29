import { useEffect, useMemo, useState } from "react";
import styles from "./seccion_3.module.css";
import { icon } from "../../../../core/icons";
import {
  getImagenProducto,
  listarProductos,
  listarProductosPorCategoria,
  listarProductosPorMarca,
  listarProductosFiltrados 
} from "../../../../core/services/producto.service";
import type { Producto } from "../../../../core/types";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Props = {
  categoriasSeleccionadas?: string[];
  marcasSeleccionadas?:     string[];
  busquedaGeneral?:         string;
  onEliminarCategoria?:     (categoria: string) => void;
  onEliminarMarca?:         (marca: string) => void;
  productosVisibles?:       number;
  onCargarMas?:             () => void;
  onAbrirFiltros?: () => void;
};

type CartItem = {
  id:       number;
  titulo:   string;
  categoria: string;
  marca:    string;
  imagen:   string;
  cantidad: number;
};

// ─── Constantes ───────────────────────────────────────────────────────────────

const STORAGE_KEY      = "cartItems";
const WHATSAPP_NUMBER  = "51915144663";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const normalizarNombre = (nombre: string | undefined | null, fallback: string): string =>
  nombre
    ?.replace(/\.[^.]+$/, "")
    ?.replace(/[_-]+/g, " ")
    ?.trim()
    ?.replace(/\b\w/g, (c) => c.toUpperCase())
    ?? fallback;

const deduplicar = (listas: Producto[][]): Producto[] => {
  const mapa = new Map<number, Producto>();
  for (const lista of listas)
    for (const p of lista) mapa.set(p.prdcid, p);
  return Array.from(mapa.values());
};
// ─── Componente ───────────────────────────────────────────────────────────────

export default function Seccion_3({
  
  categoriasSeleccionadas = [],
  marcasSeleccionadas     = [],
  busquedaGeneral         = "",
  onEliminarCategoria     = () => {},
  onEliminarMarca         = () => {},
  productosVisibles       = 12,
  onCargarMas             = () => {},
  onAbrirFiltros = () => {},
}: Props) {
  const [productos,           setProductos]           = useState<Producto[]>([]);
  const [cargando,            setCargando]            = useState(true);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [mostrarFiltros,       setMostrarFiltros]       = useState(false); // ← aquí dentro

  // ── Carga de productos ────────────────────────────────────────────────────

useEffect(() => {
  let cancelado = false; // ← flag

  const cargar = async () => {
    setCargando(true);
    try {
      const data = await listarProductosFiltrados(
        categoriasSeleccionadas,
        marcasSeleccionadas,
        busquedaGeneral
      );

      if (cancelado) return; // ← si ya hay una llamada más nueva, ignorar esta
      
      setProductos(data);
    } catch (err) {
      if (cancelado) return;
      console.error("Error cargando productos:", err);
      setProductos([]);
    } finally {
      if (!cancelado) setCargando(false);
    }
  };

  cargar();

  return () => {
    cancelado = true; // ← cuando el efecto vuelve a correr, cancela el anterior
  };
}, [categoriasSeleccionadas, marcasSeleccionadas, busquedaGeneral]);
  // ── Filtrado local por búsqueda ───────────────────────────────────────────

const productosFiltrados = productos;

  const productosRenderizados = useMemo(
    () => productosFiltrados.slice(0, productosVisibles),
    [productosFiltrados, productosVisibles]
  );

  // ── Acciones carrito / WhatsApp ───────────────────────────────────────────

  const anadirAlCarrito = () => {
    if (!productoSeleccionado) return;

    const nuevo: CartItem = {
      id:       productoSeleccionado.prdcid,
      titulo:   normalizarNombre(productoSeleccionado.prdcnombre,              `Producto ${productoSeleccionado.prdcid}`),
      categoria: normalizarNombre(productoSeleccionado.categoria?.ctgranombre, "Sin categoría"),
      marca:    normalizarNombre(productoSeleccionado.marca?.marcanombre,      "Sin marca"),
      imagen:   productoSeleccionado.prdcimgnombrebucket
        ? getImagenProducto(productoSeleccionado.prdcimgnombrebucket)
        : "",
      cantidad: 1,
    };

    const previos: CartItem[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    const siguientes = previos.some((i) => i.id === nuevo.id)
      ? previos.map((i) => (i.id === nuevo.id ? { ...i, cantidad: i.cantidad + 1 } : i))
      : [...previos, nuevo];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(siguientes));
    window.dispatchEvent(new Event("cartUpdated"));
    setProductoSeleccionado(null);
  };

  const comprarPorWhatsapp = () => {
    if (!productoSeleccionado) return;

    const mensaje = [
      "Hola, quiero comprar este producto:",
      normalizarNombre(productoSeleccionado.prdcnombre,              `Producto ${productoSeleccionado.prdcid}`),
      `Marca: ${normalizarNombre(productoSeleccionado.marca?.marcanombre,      "Sin marca")}`,
      `Categoría: ${normalizarNombre(productoSeleccionado.categoria?.ctgranombre, "Sin categoría")}`,
    ].join("\n");

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // ── Render helpers ────────────────────────────────────────────────────────

  const renderFiltros = (
    items: string[],
    onEliminar: (item: string) => void
  ) =>
    items.length > 0 ? (
      items.map((item) => (
        <button
          key={item}
          type="button"
          className={styles.tagBoton}
          onClick={() => onEliminar(item)}
        >
          <span className={styles.tagTexto}>{item}</span>
          <span className={styles.tagCerrar}>✕</span>
        </button>
      ))
    ) : (
      <span className={styles.tag}>Todas</span>
    );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <section className={styles.seccion}>

        {/* ── Filtros activos ── */}
        {/* ── Filtros activos ── */}
        <button
          type="button"
          className={styles.botonFiltrar}
          onClick={onAbrirFiltros} 
        >
          Filtrar
        </button>

        <div className={`${styles.resumen} ${mostrarFiltros ? styles.resumenVisible : ""}`}>
          <div className={styles.resumenCabecera}>
            <p className={styles.resumenTitulo}>Filtros activos</p>
            <p className={styles.resumenTexto}>
              Ajusta categorías y marcas para encontrar más rápido.
            </p>
          </div>

          <div className={styles.resumenGrid}>
            <div className={styles.resumenBloque}>
              <p className={styles.etiqueta}>Marca</p>
              <div className={styles.tagsFila}>
                {renderFiltros(marcasSeleccionadas, onEliminarMarca)}
              </div>
            </div>

            <div className={styles.resumenBloque}>
              <p className={styles.etiqueta}>Categorías</p>
              <div className={styles.tagsFila}>
                {renderFiltros(categoriasSeleccionadas, onEliminarCategoria)}
              </div>
            </div>
          </div>
        </div>

        {/* Overlay para cerrar en mobile */}
        {mostrarFiltros && (
          <div
            className={styles.filtrosOverlay}
            onClick={() => setMostrarFiltros(false)}
          />
        )}

        {/* ── Grid de productos ── */}
        <div className={styles.cuerpo}>
          {cargando ? (
            <div className={styles.vacio}>Cargando productos...</div>

          ) : productosFiltrados.length === 0 ? (
            <div className={styles.vacio}>
              {busquedaGeneral.trim() && !categoriasSeleccionadas.length && !marcasSeleccionadas.length
                ? `No se encontraron productos para "${busquedaGeneral}".`
                : "No hay productos disponibles."}
            </div>

          ) : (
            <>
              <div className={styles.gridProductos}>
                {productosRenderizados.map((producto) => {
                  const titulo    = normalizarNombre(producto.prdcnombre,                  `Producto ${producto.prdcid}`);
                  const categoria = normalizarNombre(producto.categoria?.ctgranombre,      "Sin categoría");
                  const marca     = normalizarNombre(producto.marca?.marcanombre,          "Sin marca");
                  const imagen    = producto.prdcimgnombrebucket
                    ? getImagenProducto(producto.prdcimgnombrebucket)
                    : "";

                  return (
                    <article key={producto.prdcid} className={styles.productoCard}>
                      <div className={styles.productoImagenWrap}>
                        {imagen ? (
                          <img
                            src={imagen}
                            alt={titulo}
                            className={styles.productoImagen}
                            loading="lazy"
                          />
                        ) : (
                          <div className={styles.productoPlaceholder}>Sin imagen</div>
                        )}
                      </div>

                      <h3 className={styles.productoTitulo}>{titulo}</h3>
                      <p className={styles.productoCategoria}>{categoria}</p>
                      <p className={styles.productoMarca}>{marca}</p>

                      <button
                        type="button"
                        className={styles.loQuieroButton}
                        onClick={() => setProductoSeleccionado(producto)}
                      >
                        {icon.iconCarrito({ className: styles.modalSvg })}
                        Lo quiero
                      </button>
                    </article>
                  );
                })}
              </div>

              {productosFiltrados.length > productosRenderizados.length && (
                <div className={styles.acciones}>
                  <button type="button" className={styles.cargarMas} onClick={onCargarMas}>
                    Ver más productos
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── Modal de compra ── */}
      {productoSeleccionado && (
        <div className={styles.modalOverlay} onClick={() => setProductoSeleccionado(null)}>
          <div className={styles.modalCompra} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitulo}>¿Cómo deseas continuar?</h3>
            <p className={styles.modalTexto}>Elige una opción para completar tu compra</p>

            <button type="button" className={styles.modalBotonNaranja} onClick={anadirAlCarrito}>
              {icon.iconCarrito({ className: styles.modalCarrito })}
              <span>Añadir al carrito</span>
            </button>

            <button type="button" className={styles.modalBotonVerde} onClick={comprarPorWhatsapp}>
              {icon.iconWhatsApp({ className: styles.modalWhatsapp })}
              <span>Realizar la compra</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}