import styles from "./ProductPage.module.css";
import { startTransition, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import Seccion_1 from "../components/seccion_1/seccion_1";
import Seccion_2 from "../components/seccion_2/seccion_2";
import Seccion_3 from "../components/seccion_3/seccion_3";

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

  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<string[]>([]);
  const [marcasSeleccionadas,     setMarcasSeleccionadas]     = useState<string[]>([]);
  const [busquedaGeneral,         setBusquedaGeneral]         = useState("");
  const [productosVisibles,       setProductosVisibles]       = useState(INITIAL_VISIBLE);
  const [sidebarAbierto,          setSidebarAbierto]          = useState(false);

  const queryUrl             = searchParams.get("q")?.trim()         ?? "";
  const categoriaDesdeUrl    = searchParams.get("categoria")?.trim() ?? "";
  const marcasDesdeUrl = searchParams.get("marca")
  ?.split(",")
  .map((m) => m.trim())
  .filter(Boolean) ?? [];
  const abrirFiltrosDesdeUrl = searchParams.get("filtros") === "1";

  useEffect(() => {
    if (abrirFiltrosDesdeUrl) setSidebarAbierto(true);
  }, [abrirFiltrosDesdeUrl]);

  // ── Sincronizar URL → filtros ─────────────────────────────────────────
useEffect(() => {
  if (categoriaDesdeUrl || marcasDesdeUrl.length > 0) {
    setCategoriasSeleccionadas(categoriaDesdeUrl ? [categoriaDesdeUrl] : []);
    setMarcasSeleccionadas(marcasDesdeUrl);  // ← ya es array
    setBusquedaGeneral("");
    return;
  }
  if (!queryUrl) {
    console.log("→ reseteando todo (queryUrl vacío)");
    setCategoriasSeleccionadas([]);
    setMarcasSeleccionadas([]);
    setBusquedaGeneral("");
    return;
  }
  console.log("→ seteando busquedaGeneral:", queryUrl);
  setCategoriasSeleccionadas([]);
  setMarcasSeleccionadas([]);
  setBusquedaGeneral(queryUrl);
}, [queryUrl, categoriaDesdeUrl, marcasDesdeUrl.join(",")]); 

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
      <Seccion_1 onMarcaSeleccionada={toggleMarca} />
      <div className={styles.layout}>
        <Seccion_2
          categoriasSeleccionadas={categoriasSeleccionadas}
          marcasSeleccionadas={marcasSeleccionadas}
          onCategoriaSeleccionada={toggleCategoria}
          onMarcaSeleccionada={toggleMarca}
        />

        {sidebarAbierto && (
          <>
            <div className={styles.sidebarOverlay} onClick={() => setSidebarAbierto(false)} />
            <aside className={styles.sidebarDrawer}>
              <Seccion_2
                enDrawer={true}
                categoriasSeleccionadas={categoriasSeleccionadas}
                marcasSeleccionadas={marcasSeleccionadas}
                onCategoriaSeleccionada={toggleCategoria}
                onMarcaSeleccionada={toggleMarca}
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