import styles from "./ProductPage.module.css";
import { startTransition, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import Seccion_1 from "../components/seccion_1/seccion_1";
import Seccion_2 from "../components/seccion_2/seccion_2";
import Seccion_3 from "../components/seccion_3/seccion_3";

import { listarProductos } from "../../../core/services/producto.service";
import { Producto } from "../../../core/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const normalizarNombre = (nombre: string | undefined | null, fallback: string) =>
  nombre
    ?.replace(/\.[^.]+$/, "")
    ?.replace(/[_-]+/g, " ")
    ?.trim()
    ?.replace(/\b\w/g, (c) => c.toUpperCase())
    ?? fallback;

// ─── Constantes ───────────────────────────────────────────────────────────────

const INITIAL_VISIBLE = 40;

// ─── Componente ───────────────────────────────────────────────────────────────

export default function ProductPage() {
  const [searchParams] = useSearchParams();

  const [productos,               setProductos]               = useState<Producto[]>([]);
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<string[]>([]);
  const [marcasSeleccionadas,     setMarcasSeleccionadas]     = useState<string[]>([]);
  const [busquedaGeneral,         setBusquedaGeneral]         = useState("");
  const [productosVisibles,       setProductosVisibles]       = useState(INITIAL_VISIBLE);
  const [sidebarAbierto,          setSidebarAbierto]          = useState(false);

  const queryUrl          = searchParams.get("q")?.trim()         ?? "";
  const categoriaDesdeUrl = searchParams.get("categoria")?.trim() ?? "";
  const marcaDesdeUrl     = searchParams.get("marca")?.trim()     ?? "";

  // ── Carga inicial ────────────────────────────────────────────────────────

  useEffect(() => {
    listarProductos()
      .then((data) => startTransition(() => setProductos(data)))
      .catch((err) => console.error("Error cargando productos:", err));
  }, []);

  // ── Listas únicas disponibles ─────────────────────────────────────────────

  const categoriasDisponibles = useMemo(
    () =>
      Array.from(new Set(productos.map((p) => normalizarNombre(p.categoria?.ctgranombre, "")))).filter(Boolean),
    [productos]
  );

  const marcasDisponibles = useMemo(
    () =>
      Array.from(new Set(productos.map((p) => normalizarNombre(p.marca?.marcanombre, "")))).filter(Boolean),
    [productos]
  );

  // ── Sincronizar URL → filtros ────────────────────────────────────────────

  useEffect(() => {
    if (categoriaDesdeUrl || marcaDesdeUrl) {
      setCategoriasSeleccionadas(categoriaDesdeUrl ? [categoriaDesdeUrl] : []);
      setMarcasSeleccionadas(marcaDesdeUrl ? [marcaDesdeUrl] : []);
      setBusquedaGeneral("");
      return;
    }
    if (!queryUrl) {
      setCategoriasSeleccionadas([]);
      setMarcasSeleccionadas([]);
      setBusquedaGeneral("");
      return;
    }
    setCategoriasSeleccionadas([]);
    setMarcasSeleccionadas([]);
    setBusquedaGeneral(queryUrl);
  }, [queryUrl, categoriaDesdeUrl, marcaDesdeUrl]);

  // ── Resetear paginación ───────────────────────────────────────────────────

  useEffect(() => {
    setProductosVisibles(INITIAL_VISIBLE);
  }, [busquedaGeneral, categoriasSeleccionadas, marcasSeleccionadas]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const toggleCategoria = (cat: string) =>
    setCategoriasSeleccionadas((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );

  const toggleMarca = (mar: string) =>
    setMarcasSeleccionadas((prev) =>
      prev.includes(mar) ? prev.filter((m) => m !== mar) : [...prev, mar]
    );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>
      <Seccion_1 />

      <div className={styles.layout}>

        {/* Panel lateral — desktop siempre visible, mobile oculto */}
        <Seccion_2
          categoriasSeleccionadas={categoriasSeleccionadas}
          marcasSeleccionadas={marcasSeleccionadas}
          onCategoriaSeleccionada={toggleCategoria}
          onMarcaSeleccionada={toggleMarca}
        />

        {/* Sidebar drawer — solo mobile */}
        {sidebarAbierto && (
          <>
            <div
              className={styles.sidebarOverlay}
              onClick={() => setSidebarAbierto(false)}
            />
            <aside className={styles.sidebarDrawer}>
              <Seccion_2
                categoriasSeleccionadas={categoriasSeleccionadas}
                marcasSeleccionadas={marcasSeleccionadas}
                onCategoriaSeleccionada={(cat) => {
                  toggleCategoria(cat);
                }}
                onMarcaSeleccionada={(mar) => {
                  toggleMarca(mar);
                }}
              />
            </aside>
          </>
        )}

        <Seccion_3
          categoriasSeleccionadas={categoriasSeleccionadas}
          marcasSeleccionadas={marcasSeleccionadas}
          busquedaGeneral={busquedaGeneral}
          onEliminarCategoria={toggleCategoria}
          onEliminarMarca={toggleMarca}
          productosVisibles={productosVisibles}
          onCargarMas={() => setProductosVisibles((prev) => prev + INITIAL_VISIBLE)}
          onAbrirFiltros={() => setSidebarAbierto(true)}
        />

      </div>
    </div>
  );
}