import { useEffect, useMemo, useState } from "react";
import styles from "./seccion_2.module.css";
import { icon } from "../../../../core/icons";
import { listarCategorias } from "../../../../core/services/categoria.service";
import { listarMarcas } from "../../../../core/services/marca.service";
import type { Categoria, Marca } from "../../../../core/types";

type Props = {
  categoriasSeleccionadas: string[];
  marcasSeleccionadas: string[];
  onCategoriaSeleccionada: (categoria: string) => void;
  onMarcaSeleccionada: (marca: string) => void;
};

const normalizarNombre = (nombre: string | undefined | null, fallback: string) =>
  nombre
    ?.replace(/\.[^.]+$/, "")
    ?.replace(/[_-]+/g, " ")
    ?.trim()
    ?.replace(/\b\w/g, (c) => c.toUpperCase())
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
  const [listaAbierta, setListaAbierta] = useState(true);

  useEffect(() => {
    listarCategorias().then((data) => setCategorias(data as Categoria[]));
    listarMarcas().then((data) => setMarcas(data as Marca[]));
  }, []);

  // Resetear estado abierto al cambiar de tab
  const handleCambiarTab = (tab: "categorias" | "marcas") => {
    setTabActiva(tab);
    setBusqueda("");
    setListaAbierta(true);
  };

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
    <aside className={styles.seccion}>
      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${tabActiva === "categorias" ? styles.tabActiva : ""}`}
          onClick={() => handleCambiarTab("categorias")}
        >
          Categorias
        </button>
        <button
          type="button"
          className={`${styles.tab} ${tabActiva === "marcas" ? styles.tabActiva : ""}`}
          onClick={() => handleCambiarTab("marcas")}
        >
          Marcas
        </button>
      </div>

      {/* Buscador */}
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

      {/* Lista */}
      <div className={styles.lista}>
        {/* Título con toggle en mobile */}
        <div className={styles.tituloRow}>
          <h3 className={styles.titulo}>
            {tabActiva === "categorias" ? "Categorias" : "Marcas"}
          </h3>
          <button
            type="button"
            className={`${styles.toggleBtn} ${listaAbierta ? styles.toggleAbierto : ""}`}
            onClick={() => setListaAbierta((prev) => !prev)}
            aria-label={listaAbierta ? "Ocultar lista" : "Mostrar lista"}
          >
            {icon.iconArrowDown({ className: styles.toggleSvg })}
          </button>
        </div>

        {/* Items colapsables */}
        <div className={`${styles.listaItems} ${listaAbierta ? styles.listaVisible : styles.listaOculta}`}>
          {tabActiva === "categorias" ? (
            categoriasFiltradas.length === 0 && busqueda.trim() ? (
              <p className={styles.sinResultados}>Sin resultados para "{busqueda}"</p>
            ) : (
              categoriasFiltradas.map((categoria) => {
                const nombre = normalizarNombre(categoria.ctgranombre, "Sin categoria");
                return (
                  <button
                    key={categoria.ctgraid}
                    type="button"
                    className={`${styles.item} ${categoriasSeleccionadas.includes(nombre) ? styles.itemActivo : ""}`}
                    onClick={() => onCategoriaSeleccionada(nombre)}
                  >
                    <span>{nombre}</span>
                  </button>
                );
              })
            )
          ) : (
            marcasFiltradas.length === 0 && busqueda.trim() ? (
              <p className={styles.sinResultados}>Sin resultados para "{busqueda}"</p>
            ) : (
              marcasFiltradas.map((marca) => {
                const nombre = normalizarNombre(marca.marcanombre, "Sin marca");
                return (
                  <button
                    key={marca.marcaid}
                    type="button"
                    className={`${styles.item} ${marcasSeleccionadas.includes(nombre) ? styles.itemActivo : ""}`}
                    onClick={() => onMarcaSeleccionada(nombre)}
                  >
                    <span>{nombre}</span>
                  </button>
                );
              })
            )
          )}
        </div>
      </div>
    </aside>
  );
}