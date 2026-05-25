import { useEffect, useMemo, useState } from "react";
import style from "./seccion_4.module.css";
import { icon } from "../../../../core/icons";
import {
  getImagenProducto,
  listarProductos,
} from "../../../../core/services/producto.service";
import { Producto } from "../../../../core/types";

type CartItem = {
  id: string;
  titulo: string;
  categoria: string;
  marca: string;
  imagen: string;
  cantidad: number;
};

const STORAGE_KEY = "cartItems";
const whatsappNumber = "51915144663";

// ✅ Helper de normalización igual que en seccion_3
const normalizarNombre = (nombre: string | undefined | null, fallback: string) =>
  nombre
    ?.replace(/\.[^.]+$/, "")
    ?.replace(/[_-]+/g, " ")
    ?.trim()
    ?.replace(/\b\w/g, (c) => c.toUpperCase()) ?? fallback;

const Seccion_4 = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [inicio, setInicio] = useState(0);

  // ✅ Estado del modal igual que seccion_3: booleano + Producto raw
  const [mostrarModalCompra, setMostrarModalCompra] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);

  const visiblesPorVista = 3;

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const productosData = await listarProductos(1, 500);
        setProductos(productosData);
      } catch (error) {
        console.error("No se pudieron cargar los productos:", error);
        setProductos([]);
      }
    };
    cargarProductos();
  }, []);

  const productosVisibles = useMemo(() => {
    if (productos.length === 0) return [];
    const total = Math.min(visiblesPorVista, productos.length);
    return Array.from(
      { length: total },
      (_, i) => productos[(inicio + i) % productos.length]
    );
  }, [inicio, productos]);

  const siguiente = () => {
    if (productos.length <= 1) return;
    setInicio((prev) => (prev + 1) % productos.length);
  };

  const anterior = () => {
    if (productos.length <= 1) return;
    setInicio((prev) => (prev - 1 + productos.length) % productos.length);
  };

  // ✅ Igual que seccion_3
  const abrirModalCompra = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setMostrarModalCompra(true);
  };

  const cerrarModalCompra = () => {
    setMostrarModalCompra(false);
    setProductoSeleccionado(null);
  };

  // ✅ Igual que seccion_3: normaliza desde el Producto raw al guardar
  const agregarAlCarrito = () => {
    if (!productoSeleccionado) return;

    const titulo = normalizarNombre(productoSeleccionado.prdcnombre, `Producto ${productoSeleccionado.prdcid}`);
    const categoria = normalizarNombre(productoSeleccionado.categoria?.ctgranombre, "Sin categoria");
    const marca = normalizarNombre(productoSeleccionado.marca?.marcanombre, "Sin marca");
    const imagen = productoSeleccionado.prdcimgnombrebucket
      ? getImagenProducto(productoSeleccionado.prdcimgnombrebucket)
      : "";

    const stored = localStorage.getItem(STORAGE_KEY);
    const items: CartItem[] = stored ? JSON.parse(stored) : [];
    const id = String(productoSeleccionado.prdcid);
    const existente = items.find((i) => i.id === id);

    const nextItems: CartItem[] = existente
      ? items.map((i) =>
          i.id === id ? { ...i, cantidad: i.cantidad + 1 } : i
        )
      : [...items, { id, titulo, categoria, marca, imagen, cantidad: 1 }];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
      // ✅ Dispara evento para que NavBar se entere
    window.dispatchEvent(new Event("cartUpdated"));
    cerrarModalCompra(); // ✅ igual que seccion_3
  };

  // ✅ Igual que seccion_3: normaliza desde el Producto raw
  const comprarPorWhatsapp = () => {
    if (!productoSeleccionado) return;

    const titulo = normalizarNombre(productoSeleccionado.prdcnombre, `Producto ${productoSeleccionado.prdcid}`);
    const marca = normalizarNombre(productoSeleccionado.marca?.marcaimgnombrebucket, "Sin marca");
    const categoria = normalizarNombre(productoSeleccionado.categoria?.ctgranombre, "Sin categoria");

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
    <section className={style.seccion}>
      <h2 className={style.tituloPrincipal}>Productos</h2>

      <div className={style.sliderWrap}>
        <button
          className={`${style.flecha} ${style.flechaIzquierda}`}
          type="button"
          onClick={anterior}
          aria-label="Productos anteriores"
          disabled={productos.length <= 1}
        >
          &#8249;
        </button>

        <div className={style.tarjetas}>
          {productosVisibles.length > 0 ? (
            productosVisibles.map((producto) => {
              const imagenUrl = producto.prdcimgnombrebucket
                ? getImagenProducto(producto.prdcimgnombrebucket)
                : "";

              const titulo = normalizarNombre(producto.prdcnombre, `Producto ${producto.prdcid}`);
              const categoria = normalizarNombre(producto.categoria?.ctgranombre, `Categoria ${producto.ctgraid}`);
              const marca = normalizarNombre(producto.marca?.marcanombre, `Marca ${producto.marcaid}`);

              return (
                <article key={producto.prdcid} className={style.card}>
                  <div className={style.imagenWrap}>
                    {imagenUrl ? (
                      <img
                        src={imagenUrl}
                        alt={titulo}
                        className={style.imagen}
                      />
                    ) : (
                      <div className={style.placeholder}>Sin imagen</div>
                    )}
                  </div>

                  <div className={style.cardBody}>
                    <h3 className={style.cardTitulo}>{titulo}</h3>
                    <p className={style.cardCategoria}>{categoria}</p>
                    <p className={style.cardMarca}>{marca}</p>

                    {/* ✅ Ahora llama a abrirModalCompra con el Producto raw */}
                    <button
                      className={style.loQuieroButton}
                      type="button"
                      onClick={() => abrirModalCompra(producto)}
                    >
                      <p>{icon.iconCarrito({ className: style.modalSvg })}</p>
                      <span>Lo quiero</span>
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <div className={style.vacio}>No hay productos disponibles.</div>
          )}
        </div>

        <button
          className={`${style.flecha} ${style.flechaDerecha}`}
          type="button"
          onClick={siguiente}
          aria-label="Siguientes productos"
          disabled={productos.length <= 1}
        >
          &#8250;
        </button>
      </div>

      {/* ✅ Condición igual que seccion_3: ambos estados */}
      {mostrarModalCompra && productoSeleccionado && (
        <div className={style.modalOverlay} onClick={cerrarModalCompra}>
          <div className={style.modalCompra} onClick={(e) => e.stopPropagation()}>
            <h3 className={style.modalTitulo}>Como deseas continuar?</h3>
            <p className={style.modalTexto}>
              Elige una opcion para poder completar tu compra
            </p>

            <button type="button" className={style.modalBotonNaranja} onClick={agregarAlCarrito}>
              <span className={style.modalCarrito}>
                {icon.iconCarrito({ className: style.modalCarrito })}
              </span>
              <span>Añadir al carrito</span>
            </button>

            <button type="button" className={style.modalBotonVerde} onClick={comprarPorWhatsapp}>
              <span className={style.modalWhatsapp}>
                {icon.iconWhatsApp({ className: style.modalWhtasapp })}
              </span>
              <span>Realizar la compra</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default Seccion_4;