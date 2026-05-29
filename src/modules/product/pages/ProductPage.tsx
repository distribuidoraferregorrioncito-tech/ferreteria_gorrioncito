import styles from "./ProductPage.module.css";

import { startTransition, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import Seccion_1 from "../components/seccion_1/seccion_1";
import Seccion_2 from "../components/seccion_2/seccion_2";
import Seccion_3 from "../components/seccion_3/seccion_3";

import { listarProductos } from "../../../core/services/producto.service";
import { Producto } from "../../../core/types"

const normalizarNombre = (nombre: string | undefined | null, fallback: string) =>
  nombre
    ?.replace(/\.[^.]+$/, "")
    ?.replace(/[_-]+/g, " ")
    ?.trim()
    ?.replace(/\b\w/g, (c) => c.toUpperCase()) ?? fallback;

const INITIAL_VISIBLE = 40;

export default function ProductPage() {
  const [searchParams] = useSearchParams();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<string[]>([]);
  const [marcasSeleccionadas, setMarcasSeleccionadas] = useState<string[]>([]);
  const [busquedaGeneral, setBusquedaGeneral] = useState("");
  const [productosVisibles, setProductosVisibles] = useState(INITIAL_VISIBLE);

  const queryUrl = searchParams.get("q")?.trim() ?? "";
  const categoriaDesdeUrl = searchParams.get("categoria")?.trim() ?? "";
  const marcaDesdeUrl = searchParams.get("marca")?.trim() ?? "";

  // Cargar productos una sola vez
  useEffect(() => {
    listarProductos()
      .then((data) => startTransition(() => setProductos(data)))
      .catch((err) => console.error("Error cargando productos:", err));
  }, []);

  // ── Extraer categorías y marcas únicas desde los productos ──
  const categoriasDisponibles = useMemo(
    () =>
      Array.from(
        new Set(
          productos.map((p) => normalizarNombre(p.categoria?.ctgranombre, ""))
        )
      ).filter(Boolean),
    [productos]
  );

  const marcasDisponibles = useMemo(
    () =>
      Array.from(
        new Set(
          productos.map((p) => normalizarNombre(p.marca?.marcanombre, ""))
        )
      ).filter(Boolean),
    [productos]
  );

  // ── Sincronizar URL → filtros con lógica de prioridad ──
 // ── Sincronizar URL → filtros con lógica de prioridad ──
// ── Sincronizar URL → filtros con lógica de prioridad ──
useEffect(() => {
  // Si viene de ?categoria= o ?marca= en la URL → filtros directos
  if (categoriaDesdeUrl || marcaDesdeUrl) {
    setCategoriasSeleccionadas(categoriaDesdeUrl ? [categoriaDesdeUrl] : []);
    setMarcasSeleccionadas(marcaDesdeUrl ? [marcaDesdeUrl] : []);
    setBusquedaGeneral("");
    return;
  }

  // Si no hay query → limpiar todo
  if (!queryUrl) {
    setCategoriasSeleccionadas([]);
    setMarcasSeleccionadas([]);
    setBusquedaGeneral("");
    return;
  }

  // Si viene de ?q= → SIEMPRE es búsqueda general, nunca convertir a filtro
  // La clasificación ya la hizo search.service; si llegó aquí como ?q=
  // es porque no encontró categoría/marca exacta → búsqueda por nombre de producto
  setCategoriasSeleccionadas([]);
  setMarcasSeleccionadas([]);
  setBusquedaGeneral(queryUrl);

}, [queryUrl, categoriaDesdeUrl, marcaDesdeUrl]);

  // Resetear paginación cuando cambian los filtros
  useEffect(() => {
    setProductosVisibles(INITIAL_VISIBLE);
  }, [busquedaGeneral, categoriasSeleccionadas, marcasSeleccionadas]);

  const toggleCategoria = (cat: string) =>
    setCategoriasSeleccionadas((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );

  const toggleMarca = (mar: string) =>
    setMarcasSeleccionadas((prev) =>
      prev.includes(mar) ? prev.filter((m) => m !== mar) : [...prev, mar]
    );

return (
  <div className={styles.page}>
    <Seccion_1 />

    <div className={styles.layout}>
      <Seccion_2
        categoriasSeleccionadas={categoriasSeleccionadas}
        marcasSeleccionadas={marcasSeleccionadas}
        onCategoriaSeleccionada={toggleCategoria}
        onMarcaSeleccionada={toggleMarca}
      />

      <Seccion_3
        categoriasSeleccionadas={categoriasSeleccionadas}
        marcasSeleccionadas={marcasSeleccionadas}
        busquedaGeneral={busquedaGeneral}
        onEliminarCategoria={toggleCategoria}
        onEliminarMarca={toggleMarca}
        productosVisibles={productosVisibles}
        onCargarMas={() =>
          setProductosVisibles((prev) => prev + INITIAL_VISIBLE)
        }
      />
    </div>
  </div>
);
};
