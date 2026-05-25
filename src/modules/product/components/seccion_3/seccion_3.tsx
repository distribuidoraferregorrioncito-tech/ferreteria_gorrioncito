import { useEffect, useMemo, useState } from "react";
import styles from "./seccion_3.module.css";
import { icon } from "../../../../core/icons";

import {
  getImagenProducto,
  listarProductos,
  listarProductosPorCategoria,
  listarProductosPorMarca,
} from "../../../../core/services/producto.service";

import type { Producto } from "../../../../core/types"

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

const normalizarNombre = (
  nombre: string | undefined | null,
  fallback: string
) =>
  nombre
    ?.replace(/\.[^.]+$/, "")
    ?.replace(/[_-]+/g, " ")
    ?.trim()
    ?.replace(/\b\w/g, (c) => c.toUpperCase()) ?? fallback;



export default function Seccion_3({
  categoriasSeleccionadas = [],
  marcasSeleccionadas = [],
  busquedaGeneral = "",
  onEliminarCategoria = () => {},
  onEliminarMarca = () => {},
  productosVisibles = 12,
  onCargarMas = () => {},
}: Props) {
  const STORAGE_KEY = "cartItems";
  const whatsappNumber = "51915144663";

  const [mostrarModalCompra, setMostrarModalCompra] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);

  // ─────────────────────────────────────────────────────────────
  // CARGA DE PRODUCTOS
  //
  // - Sin filtros           → listarProductos() (todos)
  // - Con categorías        → listarProductosPorCategoria() por cada una
  // - Con marcas            → listarProductosPorMarca() por cada una
  // - Con ambos             → consulta categorías Y marcas, luego intersección
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setCargandoProductos(true);

        const tieneCategorias = categoriasSeleccionadas.length > 0;
        const tieneMarcas = marcasSeleccionadas.length > 0;

        if (!tieneCategorias && !tieneMarcas) {
          // ── Sin filtros: traer todo ──
          const data = await listarProductos();
          setProductos(data);
          return;
        }

        let porCategorias: Producto[] = [];
        let porMarcas: Producto[] = [];

        if (tieneCategorias) {
          // ── Una consulta por cada categoría seleccionada ──
          const resultados = await Promise.all(
            categoriasSeleccionadas.map((cat) =>
              listarProductosPorCategoria(cat)
            )
          );
          // Aplanar y deduplicar por prdcid
          const mapa = new Map<number, Producto>();
          for (const lista of resultados) {
            for (const p of lista) {
              mapa.set(p.prdcid, p);
            }
          }
          porCategorias = Array.from(mapa.values());
        }

        if (tieneMarcas) {
          // ── Una consulta por cada marca seleccionada ──
          const resultados = await Promise.all(
            marcasSeleccionadas.map((mar) =>
              listarProductosPorMarca(mar)
            )
          );
          const mapa = new Map<number, Producto>();
          for (const lista of resultados) {
            for (const p of lista) {
              mapa.set(p.prdcid, p);
            }
          }
          porMarcas = Array.from(mapa.values());
        }

        if (tieneCategorias && tieneMarcas) {
          // ── Ambos filtros: intersección (producto debe cumplir los dos) ──
          const idsMarcas = new Set(porMarcas.map((p) => p.prdcid));
          setProductos(porCategorias.filter((p) => idsMarcas.has(p.prdcid)));
        } else if (tieneCategorias) {
          setProductos(porCategorias);
        } else {
          setProductos(porMarcas);
        }
      } catch (error) {
        console.error("Error cargando productos:", error);
        setProductos([]);
      } finally {
        setCargandoProductos(false);
      }
    };

    cargarProductos();
  }, [categoriasSeleccionadas, marcasSeleccionadas]); // 👈 se re-ejecuta cuando cambian los filtros

  useEffect(() => {
    console.log("Texto actual del buscador:", busquedaGeneral);
  }, [busquedaGeneral]);

  // ─────────────────────────────────────────────────────────────
  // FILTRADO LOCAL
  // Solo aplica el texto de búsqueda cuando NO hay filtros activos
  // ─────────────────────────────────────────────────────────────
// ✅ Busca en nombre, categoría y marca — igual que tu SAW
const productosFiltrados = useMemo(() => {
  const hayFiltros =
    categoriasSeleccionadas.length > 0 || marcasSeleccionadas.length > 0;

  if (hayFiltros) return productos;

  if (!busquedaGeneral.trim()) return productos;

  const q = busquedaGeneral.toLowerCase().trim();

  return productos.filter((producto) =>
    producto.prdcnombre?.toLowerCase().includes(q) ||
    producto.categoria?.ctgranombre?.toLowerCase().includes(q) ||
    producto.marca?.marcanombre?.toLowerCase().includes(q)
  );
}, [productos, categoriasSeleccionadas, marcasSeleccionadas, busquedaGeneral]);

  const productosRenderizados = useMemo(
    () => productosFiltrados.slice(0, productosVisibles),
    [productosFiltrados, productosVisibles]
  );

  // ─────────────────────────────────────────────────────────────
  // MODAL
  // ─────────────────────────────────────────────────────────────
  const abrirModalCompra = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setMostrarModalCompra(true);
  };

  const cerrarModalCompra = () => {
    setMostrarModalCompra(false);
    setProductoSeleccionado(null);
  };

  const anadirAlCarrito = () => {
    if (!productoSeleccionado) return;

    const titulo = normalizarNombre(
      productoSeleccionado.prdcnombre,
      `Producto ${productoSeleccionado.prdcid}`
    );
    const categoria = normalizarNombre(
      productoSeleccionado.categoria?.ctgranombre,
      "Sin categoria"
    );
      const marca = normalizarNombre(          // 👈 agregar
    productoSeleccionado.marca?.marcanombre,
    "Sin marca"
  );
    const imagen = productoSeleccionado.prdcimgnombrebucket
      ? getImagenProducto(productoSeleccionado.prdcimgnombrebucket)
      : "";

    const actual = localStorage.getItem(STORAGE_KEY);
    const cartItems: CartItem[] = actual ? JSON.parse(actual) : [];
    const existente = cartItems.find((item) => item.id === productoSeleccionado.prdcid);

    const nextItems = existente
      ? cartItems.map((item) =>
          item.id === productoSeleccionado.prdcid
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      : [
          ...cartItems,
          { id: productoSeleccionado.prdcid, titulo, categoria, marca, imagen, cantidad: 1 },
        ];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
    window.dispatchEvent(new Event("cartUpdated"));
    cerrarModalCompra();
  };

  const comprarPorWhatsapp = () => {
    if (!productoSeleccionado) return;

    const titulo = normalizarNombre(
      productoSeleccionado.prdcnombre,
      `Producto ${productoSeleccionado.prdcid}`
    );
    const marca = normalizarNombre(
      productoSeleccionado.marca?.marcanombre,
      "Sin marca"
    );
    const categoria = normalizarNombre(
      productoSeleccionado.categoria?.ctgranombre,
      "Sin categoria"
    );

    const mensaje = [
      "Hola, quiero comprar este producto:",
      titulo,
      `Marca: ${marca}`,
      `Categoria: ${categoria}`,
    ].join("\n");

    window.open(
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(mensaje)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <>
      <section className={styles.contenido}>
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

        <div className={styles.cuerpo}>
          <div className={styles.productosArea}>
            {cargandoProductos ? (
              <div className={styles.vacio}>Cargando productos...</div>
            ) : productosFiltrados.length > 0 ? (
              <>
                <div className={styles.gridProductos}>
                  {productosRenderizados.map((producto) => {
                    const titulo = normalizarNombre(
                      producto.prdcnombre,
                      `Producto ${producto.prdcid}`
                    );
                    const categoria = normalizarNombre(
                      producto.categoria?.ctgranombre,
                      "Sin categoria"
                    );
                    const marca = normalizarNombre(
                      producto.marca?.marcanombre,
                      "Sin marca"
                    );
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
                          onClick={() => abrirModalCompra(producto)}
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
                    <button
                      type="button"
                      className={styles.cargarMas}
                      onClick={onCargarMas}
                    >
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
        </div>
      </section>

      {mostrarModalCompra && productoSeleccionado && (
        <div className={styles.modalOverlay} onClick={cerrarModalCompra}>
          <div className={styles.modalCompra} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitulo}>Como deseas continuar?</h3>
            <p className={styles.modalTexto}>Elige una opcion para completar tu compra</p>

            <button
              type="button"
              className={styles.modalBotonNaranja}
              onClick={anadirAlCarrito}
            >
              <span className={styles.modalIcono}>
                {icon.iconCarrito({ className: styles.modalCarrito })}
              </span>
              <span>Añadir al carrito</span>
            </button>

            <button
              type="button"
              className={styles.modalBotonVerde}
              onClick={comprarPorWhatsapp}
            >
              <p>{icon.iconWhatsApp({ className: styles.modalWhatsapp })}</p>
              <span>Realizar la compra</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}