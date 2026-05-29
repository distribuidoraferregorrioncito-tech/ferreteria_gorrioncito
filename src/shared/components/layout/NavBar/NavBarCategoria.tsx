import { startTransition, useEffect, useState, useMemo } from "react";
import style from "./NavBarCategoria.module.css";
import { icon } from "../../../../core/icons";

import {
  listarProductos,
  getImagenProducto,
  listarProductosPorCategoria
} from "../../../../core/services/producto.service";

import {
  listarCategorias,
} from "../../../../core/services/categoria.service";

import {
  listarMarcas,
  getImagenMarca,
} from "../../../../core/services/marca.service";

// ─── Types ────────────────────────────────────────────────────────────────────

type CartItem = {
  id: string | number;
  titulo: string;
  categoria: string;
  marca: string;
  imagen: string;
  cantidad: number;
};

type CatalogProduct = {
  id: number;
  titulo: string;
  categoria: string;
  marca: string;
  marcaImagen: string; // ← logo para el sidebar
  imagen: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "cartItems";

const CACHE_CATEGORIAS = "menu_categorias";
const CACHE_MARCAS     = "menu_marcas";

const CACHE_PRODUCTOS_PREFIX = "menu_productos_";

// ─── Component ────────────────────────────────────────────────────────────────

export const NavBarCategoria = () => {

  const [mostrarCategorias, setMostrarCategorias] = useState(false);
  const [productosCatalogo, setProductosCatalogo] = useState<CatalogProduct[]>([]);
  const [categoriasMenu, setCategoriasMenu] = useState<string[]>([]);
  const [, setMarcasMenu] = useState<{ nombre: string; imagen: string }[]>([]);
  const [menuCargado, setMenuCargado] = useState(false);
  const [categoriaActiva, setCategoriaActiva] = useState("");
  const [cargandoMenu, setCargandoMenu] = useState(false);
  const [cargandoProductos, setCargandoProductos] = useState(false);

  // ─── Marcas derivadas de los productos visibles ───────────────────────────

  const marcasDeLaCategoria = useMemo(() => {
    const vistas = new Map<string, string>(); // nombre → imagen
    for (const p of productosCatalogo) {
      if (p.marca && !vistas.has(p.marca)) {
        vistas.set(p.marca, p.marcaImagen);
      }
    }
    return Array.from(vistas.entries()).map(([nombre, imagen]) => ({ nombre, imagen }));
  }, [productosCatalogo]);

  // ─── Modal ────────────────────────────────────────────────────────────────

  const [mostrarModalCompra, setMostrarModalCompra] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<CatalogProduct | null>(null);

  // ─── Cargar categorías y marcas ───────────────────────────────────────────

  const cargarMenu = async () => {

    if (menuCargado || cargandoMenu) return;

    try {
      setCargandoMenu(true);

      const categoriasCache = localStorage.getItem(CACHE_CATEGORIAS);
      const marcasCache     = localStorage.getItem(CACHE_MARCAS);

      if (categoriasCache && marcasCache) {
        const categorias = JSON.parse(categoriasCache);
        const marcas     = JSON.parse(marcasCache);
        setCategoriasMenu(categorias);
        setMarcasMenu(marcas);
        if (categorias.length > 0) setCategoriaActiva(categorias[0]);
        setMenuCargado(true);
        return;
      }

      const [categoriasData, marcasData] = await Promise.all([
        listarCategorias(),
        listarMarcas(),
      ]);

      const categoriasOrdenadas = categoriasData
        .map((c) => c.ctgranombre?.trim())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));

      const marcasLista = marcasData.map((m) => ({
        nombre: m.marcanombre,
        imagen: getImagenMarca(m.marcaimgnombrebucket),
      }));

      localStorage.setItem(CACHE_CATEGORIAS, JSON.stringify(categoriasOrdenadas));
      localStorage.setItem(CACHE_MARCAS,     JSON.stringify(marcasLista));

      startTransition(() => {
        setCategoriasMenu(categoriasOrdenadas);
        setMarcasMenu(marcasLista);
        if (categoriasOrdenadas.length > 0) setCategoriaActiva(categoriasOrdenadas[0]);
        setMenuCargado(true);
      });

    } catch (error) {
      console.error("Error al cargar menu:", error);
      setCategoriasMenu([]);
      setMarcasMenu([]);
    } finally {
      setCargandoMenu(false);
    }
  };

  // ─── Cargar productos por categoría ──────────────────────────────────────

 const cargarProductosPorCategoria = async (categoria: string) => {
  try {
    setCargandoProductos(true);

    const cacheKey = `${CACHE_PRODUCTOS_PREFIX}${categoria}`;
    const productosCache = localStorage.getItem(cacheKey);
    if (productosCache) {
      setProductosCatalogo(JSON.parse(productosCache));
      return;
    }

    const lote = await listarProductosPorCategoria(categoria);

    const transformados: CatalogProduct[] = lote.map((producto) => ({
      id:          producto.prdcid,
      titulo:      producto.prdcnombre,
      categoria:   producto.categoria?.ctgranombre  ?? "",
      marca:       producto.marca?.marcanombre       ?? "",
      marcaImagen: producto.marca?.marcaimgnombrebucket
        ? getImagenMarca(producto.marca.marcaimgnombrebucket)
        : "",
      imagen: producto.prdcimgnombrebucket
        ? getImagenProducto(producto.prdcimgnombrebucket)
        : "",
    }));

    localStorage.setItem(cacheKey, JSON.stringify(transformados));
    setProductosCatalogo(transformados);

  } finally {
    setCargandoProductos(false);
  }
};
  // ─── Escuchar cambio de categoría ────────────────────────────────────────

  useEffect(() => {
    if (!categoriaActiva) return;
    cargarProductosPorCategoria(categoriaActiva);
  }, [categoriaActiva]);

  // ─── Abrir / cerrar menú ──────────────────────────────────────────────────

  const handleToggleCategorias = () => {
    const next = !mostrarCategorias;
    setMostrarCategorias(next);
    if (next) cargarMenu();
  };

  // ─── Modal ────────────────────────────────────────────────────────────────

  const abrirModalCompra = (producto: CatalogProduct) => {
    setProductoSeleccionado(producto);
    setMostrarModalCompra(true);
  };

  // ─── Carrito ──────────────────────────────────────────────────────────────

  const anadirAlCarrito = () => {

    if (!productoSeleccionado) return;

    const data = localStorage.getItem(STORAGE_KEY);

    const cartItems: CartItem[] = (() => {
      if (!data) return [];
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })();

    const existente = cartItems.find((item) => item.id === productoSeleccionado.id);

    const nextItems: CartItem[] = existente
      ? cartItems.map((item) =>
          item.id === productoSeleccionado.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      : [
          ...cartItems,
          {
            id:        productoSeleccionado.id,
            titulo:    productoSeleccionado.titulo,
            categoria: productoSeleccionado.categoria,
            marca:     productoSeleccionado.marca,
            imagen:    productoSeleccionado.imagen,
            cantidad:  1,
          },
        ];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
    window.dispatchEvent(new Event("cartUpdated"));

    setMostrarModalCompra(false);
    setMostrarCategorias(false);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <button
        type="button"
        className={style.linkButton}
        onClick={handleToggleCategorias}
      >
        Categorias
      </button>

      {mostrarCategorias && (
        <div
          className={style.overlay}
          onClick={() => setMostrarCategorias(false)}
        >
          <div
            className={style.panel}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={style.panelContenido}>

              {/* Categorías */}

              <aside className={style.sidebar}>

                <h3 className={style.panelTitulo}>Categorias</h3>

                <p className={style.panelSubtitulo}>
                  Explora el catalogo por familia de productos.
                </p>

                <div className={style.listaCategorias}>
                  {categoriasMenu.map((categoria, index) => (
                    <button
                      key={categoria}
                      type="button"
                      className={`${style.categoriaItem} ${
                        categoriaActiva.trim().toLowerCase() ===
                        categoria.trim().toLowerCase()
                          ? style.categoriaActiva
                          : ""
                      }`}
                      onClick={() => setCategoriaActiva(categoria)}
                    >
                      <span>{categoria}</span>
                      <span className={style.categoriaFlecha}>
                        {index === 0 ? ">" : "+"}
                      </span>
                    </button>
                  ))}
                </div>

              </aside>

              {/* Productos */}

              <section className={style.productosArea}>

                <div className={style.productosEncabezado}>
                  <div>
                    <h3 className={style.productosTitulo}>Productos destacados</h3>
                    <p className={style.productosTexto}>
                      Una vista rapida del catalogo disponible.
                    </p>
                  </div>
                  <span className={style.productosBadge}>
                    {productosCatalogo.length}
                  </span>
                </div>

                {cargandoProductos ? (

                  <div className={style.panelVacioCentro}>
                    Cargando productos...
                  </div>

                ) : productosCatalogo.length > 0 ? (

                  <div className={style.gridProductos}>
                    {productosCatalogo.map((producto) => (
                      <article key={producto.id} className={style.productoCard}>

                        <div className={style.productoImagenWrap}>
                          {producto.imagen ? (
                            <img
                              src={producto.imagen}
                              alt={producto.titulo}
                              className={style.productoImagen}
                            />
                          ) : (
                            <div className={style.productoPlaceholder}>
                              Sin imagen
                            </div>
                          )}
                        </div>

                        <h4 className={style.productoTitulo}>{producto.titulo}</h4>

                        <button
                          type="button"
                          className={style.loQuieroButton}
                          onClick={() => abrirModalCompra(producto)}
                        >
                          <p>{icon.iconCarrito({ className: style.modalSvg })}</p>
                          Lo quiero
                        </button>

                      </article>
                    ))}
                  </div>

                ) : (

                  <div className={style.panelVacioCentro}>
                    No hay productos para mostrar.
                  </div>

                )}

              </section>

              {/* Marcas — solo las presentes en la categoría activa */}

              <aside className={style.marcasBox}>

                <h3 className={style.panelTitulo}>Marcas</h3>

                <p className={style.panelSubtitulo}>
                  Aliados con presencia constante en stock.
                </p>

                <div className={style.marcasLista}>
                  {cargandoProductos ? (

                    <p className={style.panelSubtitulo}>Cargando...</p>

                  ) : marcasDeLaCategoria.length > 0 ? (

                    marcasDeLaCategoria.map((marca) => (
                      <div key={marca.nombre} className={style.marcaItem}>
                        {marca.imagen ? (
                          <img
                            src={marca.imagen}
                            alt={marca.nombre}
                            className={style.marcaImg}
                          />
                        ) : (
                          <div className={style.marcaPlaceholder}>
                            {marca.nombre}
                          </div>
                        )}
                      </div>
                    ))

                  ) : (

                    <p className={style.panelSubtitulo}>Sin marcas.</p>

                  )}
                </div>

              </aside>

            </div>
          </div>
        </div>
      )}

      {/* Modal */}

      {mostrarModalCompra && (
        <div
          className={style.modalOverlay}
          onClick={() => setMostrarModalCompra(false)}
        >
          <div
            className={style.modalCompra}
            onClick={(e) => e.stopPropagation()}
          >

            <h3 className={style.modalTitulo}>Como deseas continuar?</h3>

            <p className={style.modalTexto}>
              Elige una opcion para poder completar tu compra
            </p>

            <button
              type="button"
              className={style.modalBotonNaranja}
              onClick={anadirAlCarrito}
            >
              <span>{icon.iconCarrito({ className: style.icono })}</span>
              <span>Anadir al carrito</span>
            </button>

            <button
              type="button"
              className={style.modalBotonVerde}
            >
              <span>{icon.iconWhatsApp({ className: style.icono })}</span>
              <span>Realizar la compra</span>
            </button>

          </div>
        </div>
      )}
    </>
  );
};