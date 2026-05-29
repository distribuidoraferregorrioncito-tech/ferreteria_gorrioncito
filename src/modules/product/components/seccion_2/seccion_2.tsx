import { useEffect, useMemo, useState } from "react";
import styles from "./seccion_2.module.css";
import { icon } from "../../../../core/icons";
import { listarCategorias } from "../../../../core/services/categoria.service";
import { listarMarcas } from "../../../../core/services/marca.service";
import type { Categoria, Marca } from "../../../../core/types";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Props = {
  categoriasSeleccionadas: string[];
  marcasSeleccionadas:     string[];
  onCategoriaSeleccionada: (categoria: string) => void;
  onMarcaSeleccionada:     (marca: string) => void;
  enDrawer?:               boolean;   // ← nueva prop
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const normalizarNombre = (nombre: string | undefined | null, fallback: string): string =>
  nombre
    ?.replace(/\.[^.]+$/, "")
    ?.replace(/[_-]+/g, " ")
    ?.trim()
    ?.replace(/\b\w/g, (c) => c.toUpperCase())
    ?? fallback;

// ─── Componente ───────────────────────────────────────────────────────────────

export default function Seccion_2({
  categoriasSeleccionadas,
  marcasSeleccionadas,
  onCategoriaSeleccionada,
  onMarcaSeleccionada,
  enDrawer = false,
}: Props) {
  const [tabActiva,  setTabActiva]  = useState<"categorias" | "marcas">("categorias");
  const [busqueda,   setBusqueda]   = useState("");
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [marcas,     setMarcas]     = useState<Marca[]>([]);

  useEffect(() => {
    listarCategorias().then((data) => setCategorias(data as Categoria[]));
    listarMarcas().then((data)     => setMarcas(data as Marca[]));
  }, []);

  const handleCambiarTab = (tab: "categorias" | "marcas") => {
    setTabActiva(tab);
    setBusqueda("");
  };

  const categoriasFiltradas = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return categorias.filter((item) =>
      normalizarNombre(item.ctgranombre, "").toLowerCase().includes(q)
    );
  }, [busqueda, categorias]);

  const marcasFiltradas = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return marcas.filter((item) =>
      normalizarNombre(item.marcanombre, "").toLowerCase().includes(q)
    );
  }, [busqueda, marcas]);

  const renderItems = () => {
    if (tabActiva === "categorias") {
      if (categoriasFiltradas.length === 0 && busqueda.trim())
        return <p className={styles.sinResultados}>Sin resultados para "{busqueda}"</p>;

      return categoriasFiltradas.map((categoria) => {
        const nombre = normalizarNombre(categoria.ctgranombre, "Sin categoría");
        return (
          <button
            key={categoria.ctgraid}
            type="button"
            className={`${styles.item} ${categoriasSeleccionadas.includes(nombre) ? styles.itemActivo : ""}`}
            onClick={() => onCategoriaSeleccionada(nombre)}
          >
            {nombre}
          </button>
        );
      });
    }

    if (marcasFiltradas.length === 0 && busqueda.trim())
      return <p className={styles.sinResultados}>Sin resultados para "{busqueda}"</p>;

    return marcasFiltradas.map((marca) => {
      const nombre = normalizarNombre(marca.marcanombre, "Sin marca");
      return (
        <button
          key={marca.marcaid}
          type="button"
          className={`${styles.item} ${marcasSeleccionadas.includes(nombre) ? styles.itemActivo : ""}`}
          onClick={() => onMarcaSeleccionada(nombre)}
        >
          {nombre}
        </button>
      );
    });
  };

  return (
     <aside className={`${styles.seccion} ${enDrawer ? styles.seccionDrawer : ""}`}>

      {/* ── Tabs ── */}
      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${tabActiva === "categorias" ? styles.tabActiva : ""}`}
          onClick={() => handleCambiarTab("categorias")}
        >
          Categorías
        </button>
        <button
          type="button"
          className={`${styles.tab} ${tabActiva === "marcas" ? styles.tabActiva : ""}`}
          onClick={() => handleCambiarTab("marcas")}
        >
          Marcas
        </button>
      </div>

      {/* ── Buscador ── */}
      <div className={styles.searchBox}>
        {icon.iconLupa({ className: styles.lupaIcon })}
        <input
          type="text"
          placeholder={tabActiva === "categorias" ? "Buscar categoría" : "Buscar marca"}
          className={styles.searchInput}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* ── Lista ── */}
      <div className={styles.lista}>
        <h3 className={styles.titulo}>
          {tabActiva === "categorias" ? "Categorías" : "Marcas"}
        </h3>
        <div className={styles.listaItems}>
          {renderItems()}
        </div>
      </div>

    </aside>
  );
}