import { useEffect, useMemo, useState } from "react";
import styles from "./seccion_2.module.css";
import { icon } from "../../../../core/icons";

import {
  listarCategorias,
} from "../../../../core/services/categoria.service";

import {
  listarMarcas,
} from "../../../../core/services/marca.service";

import type { Categoria,Marca } from "../../../../core/types";
type Props = {
  categoriasSeleccionadas: string[];
  marcasSeleccionadas: string[];
  onCategoriaSeleccionada: (categoria: string) => void;
  onMarcaSeleccionada: (marca: string) => void;
};

// Normaliza el nombre del bucket/archivo al mismo formato que se muestra en pantalla
const normalizarNombre = (nombre: string | undefined | null, fallback: string) =>
  nombre
    ?.replace(/\.[^.]+$/, "")        // quita extensión
    ?.replace(/[_-]+/g, " ")         // guiones/underscores → espacios
    ?.trim()
    ?.replace(/\b\w/g, (c) => c.toUpperCase()) // Title Case
    ?? fallback;

export default function Seccion_2({
  categoriasSeleccionadas,
  marcasSeleccionadas,
  onCategoriaSeleccionada,
  onMarcaSeleccionada,
}: Props) {
  const [tabActiva, setTabActiva] = useState<"categorias" | "marcas">("categorias");
  const [busqueda, setBusqueda] = useState("");

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);

  useEffect(() => {
    listarCategorias().then((data) => setCategorias(data as Categoria[]));
    listarMarcas().then((data) => setMarcas(data as Marca[]));
  }, []);

  // ─── Filtrado: comparar sobre el nombre YA normalizado ───────────────────
  const categoriasFiltradas = useMemo(() => {
    const query = busqueda.toLowerCase().trim();
    return categorias.filter((item) =>
      normalizarNombre(item.ctgranombre, "").toLowerCase().includes(query)
    );
  }, [busqueda, categorias]);

  const marcasFiltradas = useMemo(() => {
    const query = busqueda.toLowerCase().trim();
    return marcas.filter((item) =>
      normalizarNombre(item.marcanombre, "").toLowerCase().includes(query)
    );
  }, [busqueda, marcas]);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${tabActiva === "categorias" ? styles.tabActiva : ""}`}
          onClick={() => { setTabActiva("categorias"); setBusqueda(""); }}
        >
          Categorias
        </button>
        <button
          type="button"
          className={`${styles.tab} ${tabActiva === "marcas" ? styles.tabActiva : ""}`}
          onClick={() => { setTabActiva("marcas"); setBusqueda(""); }}
        >
          Marcas
        </button>
      </div>

      <div className={styles.searchBox}>
        <p>{icon.iconLupa({ className: styles.modalSvg })}</p>
        <input
          type="text"
          placeholder={tabActiva === "categorias" ? "Buscar Categoria" : "Buscar Marca"}
          className={styles.searchInput}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {tabActiva === "categorias" ? (
        <div className={styles.lista}>
          <h3 className={styles.titulo}>Categorias</h3>
          {categoriasFiltradas.length === 0 && busqueda.trim() ? (
            <p className={styles.sinResultados}>Sin resultados para "{busqueda}"</p>
          ) : (
            categoriasFiltradas.map((categoria) => {
              // El nombre normalizado es lo que se muestra Y lo que se pasa al filtro
              const nombre = normalizarNombre(categoria.ctgranombre, "Sin categoria");
              return (
                <button
                  key={categoria.ctgraid}
                  type="button"
                  className={`${styles.item} ${
                    categoriasSeleccionadas.includes(nombre) ? styles.itemActivo : ""
                  }`}
                  onClick={() => onCategoriaSeleccionada(nombre)}
                >
                  <span>{nombre}</span>
                </button>
              );
            })
          )}
        </div>
      ) : (
        <div className={styles.lista}>
          <h3 className={styles.titulo}>Marcas</h3>
          {marcasFiltradas.length === 0 && busqueda.trim() ? (
            <p className={styles.sinResultados}>Sin resultados para "{busqueda}"</p>
          ) : (
            marcasFiltradas.map((marca) => {
              const nombre = normalizarNombre(marca.marcanombre, "Sin marca");
              return (
                <button
                  key={marca.marcaid}
                  type="button"
                  className={`${styles.item} ${
                    marcasSeleccionadas.includes(nombre) ? styles.itemActivo : ""
                  }`}
                  onClick={() => onMarcaSeleccionada(nombre)}
                >
                  <span>{nombre}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </aside>
  );
}