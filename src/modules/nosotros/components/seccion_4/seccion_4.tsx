import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./seccion_4.module.css";
import { supabase } from "../../../../lib/supabase";
import { getField } from "../../../../shared/utils/catalogImage";

type CategoriaRelacionada = {
  id: number;
  nombre: string;
  total: number;
};

type BloqueCatalogo = {
  titulo: string;
  descripcion: string;
  keywords: string[];
  etiqueta: string;
};

type CategoriaBucket = BloqueCatalogo & {
  items: CategoriaRelacionada[];
};

const bloquesBase: BloqueCatalogo[] = [
  {
    titulo: "Lineas operativas",
    descripcion: "Categorias frecuentes para abastecimiento continuo y atencion comercial.",
    etiqueta: "Operacion",
    keywords: ["embols", "accesor", "gasfiter", "griferi", "sanitari", "valvula", "bronce"],
  },
  {
    titulo: "Seguridad personal",
    descripcion: "Equipos y categorias pensadas para proteccion y trabajo seguro.",
    etiqueta: "Proteccion",
    keywords: [
      "proteccion",
      "guante",
      "respira",
      "altura",
      "cabeza",
      "facial",
      "audit",
      "corporal",
      "calzado",
      "epp",
      "seguridad",
    ],
  },
  {
    titulo: "Infraestructura tecnica",
    descripcion: "Familias ligadas a obra, redes, instalaciones y operacion tecnica.",
    etiqueta: "Infraestructura",
    keywords: [
      "emergencia",
      "absorb",
      "bloqueo",
      "etiquetado",
      "vial",
      "senal",
      "tuber",
      "conexion",
      "rotoplas",
      "fusion",
      "llave",
    ],
  },
  {
    titulo: "Herramientas y soporte",
    descripcion: "Categorias utiles para montaje, mantenimiento y trabajo en campo.",
    etiqueta: "Soporte",
    keywords: ["herramienta", "manual", "electric", "neumatic", "taladro", "disco"],
  },
];

function buildDisplayName(rawName: string | null, fileName: string | null, fallback: string) {
  const source = rawName || fileName;
  if (!source) return fallback;

  const baseName = source.replace(/\.[^.]+$/, "");
  const normalized = baseName.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

  if (!normalized) return fallback;

  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function Seccion_4() {
  const [categorias, setCategorias] = useState<CategoriaRelacionada[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarCategoriasRelacionadas = async () => {
      setCargando(true);

      try {
        const [categoriasResult, productosResult] = await Promise.all([
          supabase.from("categoria").select("*"),
          supabase.from("producto").select("ctgraid"),
        ]);

        if (categoriasResult.error) {
          throw categoriasResult.error;
        }

        if (productosResult.error) {
          throw productosResult.error;
        }

        const conteo = new Map<number, number>();
        for (const row of (productosResult.data ?? []) as Record<string, unknown>[]) {
          const categoriaId = getField<number>(row, "ctgraid", "ctgraId");
          if (categoriaId === null || categoriaId === undefined) continue;

          conteo.set(Number(categoriaId), (conteo.get(Number(categoriaId)) ?? 0) + 1);
        }

        const categoriasMapeadas = ((categoriasResult.data ?? []) as Record<string, unknown>[])
          .map((row, index) => {
            const id = getField<number>(row, "ctgraId", "ctgraid", "id") ?? index + 1;
            const nombre = getField<string>(
              row,
              "ctgraNombre",
              "ctgranombre",
              "categoriaNombre",
              "categorianombre",
              "nombre"
            );
            const imagenNombre = getField<string>(row, "ctgraImgNombre", "ctgraimgnombre");

            return {
              id: Number(id),
              nombre: buildDisplayName(nombre, imagenNombre, `Categoria ${id}`),
              total: conteo.get(Number(id)) ?? 0,
            };
          })
          .filter((item) => item.nombre);

        setCategorias(
          categoriasMapeadas.sort((a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre))
        );
      } catch (error) {
        console.error("No se pudieron cargar las categorias relacionadas:", error);
        setCategorias([]);
      } finally {
        setCargando(false);
      }
    };

    cargarCategoriasRelacionadas();
  }, []);

  const bloques = useMemo<CategoriaBucket[]>(() => {
    const usados = new Set<number>();

    const agrupados = bloquesBase.map((bloque) => {
      const items = categorias
        .filter((categoria) => {
          const nombreNormalizado = normalizeText(categoria.nombre);
          return bloque.keywords.some((keyword) => nombreNormalizado.includes(keyword));
        })
        .sort((a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre))
        .slice(0, 8);

      for (const item of items) {
        usados.add(item.id);
      }

      return {
        ...bloque,
        items,
      };
    });

    const restantes = categorias
      .filter((categoria) => !usados.has(categoria.id))
      .sort((a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre));

    for (const bloque of agrupados) {
      while (bloque.items.length < 6 && restantes.length > 0) {
        const siguiente = restantes.shift();
        if (!siguiente) break;
        bloque.items.push(siguiente);
      }
    }

    return agrupados;
  }, [categorias]);

  return (
    <section className={styles.seccion}>
      <div className={styles.contenido}>
        <h2 className={styles.titulo}>
          Todo lo necesario para que tu proyecto avance con respaldo comercial
        </h2>
        <p className={styles.descripcion}>
          Estos bloques ahora se relacionan con las categorias reales del catalogo. Si
          buscas guantes, proteccion o herramientas similares, cada acceso te lleva al
          filtro correspondiente.
        </p>

        <div className={styles.grid}>
          {bloques.map((bloque) => (
            <article key={bloque.titulo} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTop}>
                  <span className={styles.badge}>{bloque.etiqueta}</span>
                  <span className={styles.resumenCantidad}>
                    {bloque.items.length} categorias
                  </span>
                </div>
                <h3>{bloque.titulo}</h3>
                <p>{bloque.descripcion}</p>
              </div>

              <div className={styles.cardBody}>
                {bloque.items.length > 0 ? (
                  <ul className={styles.lista}>
                    {bloque.items.map((item) => (
                      <li key={item.id}>
                        <Link
                          to={`/product?categoria=${encodeURIComponent(item.nombre)}`}
                          className={styles.itemLink}
                        >
                          <span className={styles.itemInfo}>
                            <span className={styles.itemPunto} aria-hidden="true" />
                            <span className={styles.itemNombre}>{item.nombre}</span>
                          </span>
                          
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className={styles.vacioBloque}>
                    {cargando ? "Cargando categorias..." : "No hay categorias relacionadas."}
                  </div>
                )}

                {bloque.items[0] ? (
                  <Link
                    to={`/product?categoria=${encodeURIComponent(bloque.items[0].nombre)}`}
                    className={styles.cta}
                  >
                    Explorar bloque
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
