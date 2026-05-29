import { useEffect, useMemo, useState } from "react";
import styles from "./seccion_3.module.css";
import { icon } from "../../../../core/icons";
import {
  getImagenProducto,
  listarProductos,
  listarProductosPorCategoria,
  listarProductosPorMarca,
} from "../../../../core/services/producto.service";
import type { Producto } from "../../../../core/types";

type Props = {
  categoriasSeleccionadas?: string[];
  marcasSeleccionadas?: string[];
  busquedaGeneral?: string;
  onEliminarCategoria?: (categoria: string) => void;
  onEliminarMarca?: (marca: string) => void;
  productosVisibles?: number;
  onCargarMas?: () => void;
};

type CartItem = {
  id: number;
  titulo: string;
  categoria: string;
  marca: string;
  imagen: string;
  cantidad: number;
};

const STORAGE_KEY = "cartItems";
const WHATSAPP_NUMBER = "51915144663";

const normalizarNombre = (nombre: string | undefined | null, fallback: string) =>
  nombre
    ?.replace(/\.[^.]+$/, "")
    ?.replace(/[_-]+/g, " ")
    ?.trim()
    ?.replace(/\b\w/g, (c) => c.toUpperCase())
    ?? fallback;

export default function Seccion_3({
  categoriasSeleccionadas = [],
  marcasSeleccionadas = [],
  busquedaGeneral = "",
  onEliminarCategoria = () => {},
  onEliminarMarca = () => {},
  productosVisibles = 12,
  onCargarMas = () => {},
}: Props) {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);

  // ── Carga de productos ──────────────────────────────────────
  useEffect(() => {
    const cargar = async () => {
      try {
        setCargando(true);

        const tieneCategorias = categoriasSeleccionadas.length > 0;
        const tieneMarcas = marcasSeleccionadas.length > 0;

        if (!tieneCategorias && !tieneMarcas) {
          setProductos(await listarProductos());
          return;
        }

        const deduplicar = (listas: Producto[][]): Producto[] => {
          const mapa = new Map<number, Producto>();
          for (const lista of listas)
            for (const p of lista) mapa.set(p.prdcid, p);
          return Array.from(mapa.values());
        };

        const porCategorias = tieneCategorias
          ? deduplicar(await Promise.all(categoriasSeleccionadas.map(listarProductosPorCategoria)))
          : [];

        const porMarcas = tieneMarcas
          ? deduplicar(await Promise.all(marcasSeleccionadas.map(listarProductosPorMarca)))
          : [];

        if (tieneCategorias && tieneMarcas) {
          const idsMarcas = new Set(porMarcas.map((p) => p.prdcid));
          setProductos(porCategorias.filter((p) => idsMarcas.has(p.prdcid)));
        } else {
          setProductos(tieneCategorias ? porCategorias : porMarcas);
        }
      } catch (error) {
        console.error("Error cargando productos:", error);
        setProductos([]);
      } finally {
        setCargando(false);
      }
    };

    cargar();
  }, [categoriasSeleccionadas, marcasSeleccionadas]);

  // ── Filtrado local por búsqueda ─────────────────────────────
  const productosFiltrados = useMemo(() => {
    const hayFiltros = categoriasSeleccionadas.length > 0 || marcasSeleccionadas.length > 0;
    if (hayFiltros || !busquedaGeneral.trim()) return productos;

    const q = busquedaGeneral.toLowerCase().trim();
    return productos.filter(
      (p) =>
        p.prdcnombre?.toLowerCase().includes(q) ||
        p.categoria?.ctgranombre?.toLowerCase().includes(q) ||
        p.marca?.marcanombre?.toLowerCase().includes(q)
    );
  }, [productos, categoriasSeleccionadas, marcasSeleccionadas, busquedaGeneral]);

  const productosRenderizados = useMemo(
    () => productosFiltrados.slice(0, productosVisibles),
    [productosFiltrados, productosVisibles]
  );

  // ── Modal ───────────────────────────────────────────────────
  const abrirModal = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setProductoSeleccionado(null);
  };

  const anadirAlCarrito = () => {
    if (!productoSeleccionado) return;

    const nuevo: CartItem = {
      id: productoSeleccionado.prdcid,
      titulo: normalizarNombre(productoSeleccionado.prdcnombre, `Producto ${productoSeleccionado.prdcid}`),
      categoria: normalizarNombre(productoSeleccionado.categoria?.ctgranombre, "Sin categoria"),
      marca: normalizarNombre(productoSeleccionado.marca?.marcanombre, "Sin marca"),
      imagen: productoSeleccionado.prdcimgnombrebucket
        ? getImagenProducto(productoSeleccionado.prdcimgnombrebucket)
        : "",
      cantidad: 1,
    };

    const previos: CartItem[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    const existente = previos.find((i) => i.id === nuevo.id);

    const siguientes = existente
      ? previos.map((i) => (i.id === nuevo.id ? { ...i, cantidad: i.cantidad + 1 } : i))
      : [...previos, nuevo];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(siguientes));
    window.dispatchEvent(new Event("cartUpdated"));
    cerrarModal();
  };

  const comprarPorWhatsapp = () => {
    if (!productoSeleccionado) return;

    const mensaje = [
      "Hola, quiero comprar este producto:",
      normalizarNombre(productoSeleccionado.prdcnombre, `Producto ${productoSeleccionado.prdcid}`),
      `Marca: ${normalizarNombre(productoSeleccionado.marca?.marcanombre, "Sin marca")}`,
      `Categoria: ${normalizarNombre(productoSeleccionado.categoria?.ctgranombre, "Sin categoria")}`,
    ].join("\n");

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // ── Render ──────────────────────────────────────────────────
  return (
    <>
      <section className={styles.seccion}>

        {/* Filtros activos */}
        <div className={styles.resumen}>
          <div className={styles.resumenCabecera}>
            <div>
              <p className={styles.resumenTitulo}>Filtros activos</p>
              <p className={styles.resumenTexto}>
                Ajusta categorias y marcas para encontrar mas rapido.
              </p>
            </div>
          </div>

          <div className={styles.resumenGrid}>
            <div className={styles.resumenBloque}>
              <p className={styles.etiqueta}>Marca</p>
              <div className={styles.tagsFila}>
                {marcasSeleccionadas.length > 0 ? (
                  marcasSeleccionadas.map((marca) => (
                    <button
                      key={marca}
                      type="button"
                      className={styles.tagBoton}
                      onClick={() => onEliminarMarca(marca)}
                    >
                      <span className={styles.tagTexto}>{marca}</span>
                      <span className={styles.tagCerrar}>x</span>
                    </button>
                  ))
                ) : (
                  <span className={styles.tag}>Todas</span>
                )}
              </div>
            </div>

            <div className={styles.resumenBloque}>
              <p className={styles.etiqueta}>Categorias</p>
              <div className={styles.tagsFila}>
                {categoriasSeleccionadas.length > 0 ? (
                  categoriasSeleccionadas.map((categoria) => (
                    <button
                      key={categoria}
                      type="button"
                      className={styles.tagBoton}
                      onClick={() => onEliminarCategoria(categoria)}
                    >
                      <span className={styles.tagTexto}>{categoria}</span>
                      <span className={styles.tagCerrar}>x</span>
                    </button>
                  ))
                ) : (
                  <span className={styles.tag}>Todas</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Grid de productos */}
        <div className={styles.cuerpo}>
          {cargando ? (
            <div className={styles.vacio}>Cargando productos...</div>
          ) : productosFiltrados.length > 0 ? (
            <>
              <div className={styles.gridProductos}>
                {productosRenderizados.map((producto) => {
                  const titulo = normalizarNombre(producto.prdcnombre, `Producto ${producto.prdcid}`);
                  const categoria = normalizarNombre(producto.categoria?.ctgranombre, "Sin categoria");
                  const marca = normalizarNombre(producto.marca?.marcanombre, "Sin marca");
                  const imagen = producto.prdcimgnombrebucket
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
                        onClick={() => abrirModal(producto)}
                      >
                        <p>{icon.iconCarrito({ className: styles.modalSvg })}</p>
                        Lo quiero
                      </button>
                    </article>
                  );
                })}
              </div>

              {productosFiltrados.length > productosRenderizados.length && (
                <div className={styles.acciones}>
                  <button type="button" className={styles.cargarMas} onClick={onCargarMas}>
                    Ver mas productos
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className={styles.vacio}>
              {busquedaGeneral.trim() &&
              categoriasSeleccionadas.length === 0 &&
              marcasSeleccionadas.length === 0
                ? `No se encontraron productos para "${busquedaGeneral}".`
                : "No hay productos disponibles."}
            </div>
          )}
        </div>
      </section>

      {/* Modal de compra */}
      {mostrarModal && productoSeleccionado && (
        <div className={styles.modalOverlay} onClick={cerrarModal}>
          <div className={styles.modalCompra} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitulo}>Como deseas continuar?</h3>
            <p className={styles.modalTexto}>Elige una opcion para completar tu compra</p>

            <button type="button" className={styles.modalBotonNaranja} onClick={anadirAlCarrito}>
              <span className={styles.modalIcono}>
                {icon.iconCarrito({ className: styles.modalCarrito })}
              </span>
              <span>Añadir al carrito</span>
            </button>

            <button type="button" className={styles.modalBotonVerde} onClick={comprarPorWhatsapp}>
              <p>{icon.iconWhatsApp({ className: styles.modalWhatsapp })}</p>
              <span>Realizar la compra</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}