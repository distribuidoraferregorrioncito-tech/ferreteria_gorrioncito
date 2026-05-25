import { useEffect, useState } from "react";
import styles from "./seccion_2.module.css";
import { supabase } from "../../../../lib/supabase";
import {
  getField,
  listStorageFolderFiles,
  resolveFolderImage,
  resolveStorageFileName,
} from "../../../../shared/utils/catalogImage";

type MarcaItem = {
  id: number;
  nombre: string;
  imagen: string;
};

function getStorageUrl(bucketName: string | null, fileName: string | null) {
  if (!bucketName || !fileName) return "";

  const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
  return data?.publicUrl ?? "";
}

function buildDisplayName(rawName: string | null, fileName: string | null, fallback: string) {
  const source = rawName || fileName;
  if (!source) return fallback;

  const baseName = source.replace(/\.[^.]+$/, "");
  const normalized = baseName.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

  if (!normalized) return fallback;

  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function Seccion_2() {
  const [marcas, setMarcas] = useState<MarcaItem[]>([]);

useEffect(() => {
  const cargarMarcas = async () => {
    try {
      const { data, error } = await supabase
        .from("marca")
        .select("*")
        .eq("marcaimportante", true)
        .limit(12);

      if (error) throw error;

      const marcasMapeadas = ((data ?? []) as Record<string, unknown>[])
        .map((row, index) => {
          const id = (row["marcaid"] as number) ?? index + 1;
          const nombre = (row["marcanombre"] as string) ?? null;
          const archivoNombre = (row["marcaimgnombrebucket"] as string) ?? null;

          // El archivo está en bucket "imagenes", carpeta "marca/"
          const imagen = archivoNombre
            ? getStorageUrl("imagenes", `marca/${archivoNombre}`)
            : "";

          return {
            id: Number(id),
            nombre: nombre ?? `Marca ${id}`,
            imagen,
          };
        })
        .filter((item) => item.nombre);

      setMarcas(marcasMapeadas);
    } catch (error) {
      console.error("No se pudieron cargar las marcas:", error);
      setMarcas([]);
    }
  };

  cargarMarcas();
}, []);

  return (
    <section className={styles.seccion}>
      <div className={styles.contenido}>
        <div className={styles.encabezado}>
          <div>
            
            <h2 className={styles.titulo}>Marcas reconocidas en nuestro portafolio</h2>
            <p className={styles.descripcion}>
              Trabajamos con fabricantes y lineas comerciales con presencia
              constante en seguridad industrial, ferreteria y suministros para obra.
            </p>
          </div>
        </div>

        <div className={styles.grid}>
          {marcas.length > 0 ? (
            marcas.map((marca) => (
              <div key={marca.id} className={styles.marcaCard}>
                {marca.imagen ? (
                  <img src={marca.imagen} alt={marca.nombre} className={styles.marcaImg} />
                ) : (
                  <div className={styles.placeholder}>{marca.nombre}</div>
                )}
              </div>
            ))
          ) : (
            <div className={styles.vacio}>No hay marcas disponibles.</div>
          )}
        </div>
      </div>
    </section>
  );
}
