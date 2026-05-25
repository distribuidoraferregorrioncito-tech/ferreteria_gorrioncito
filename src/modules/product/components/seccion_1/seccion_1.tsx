import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./seccion_1.module.css";
import { supabase } from "../../../../lib/supabase";
import {
  listarMarcas,
  getImagenMarca,
} from "../../../../core/services/marca.service";

import type { Marca } from "../../../../core/types"
type MarcaItem = {
  id: number;
  nombre: string;
  imagen: string;
};

function buildDisplayName(rawName: string | null, fallback: string) {
  const source = rawName || fallback;
  if (!source) return "Marca";

  const baseName = source.replace(/\.[^.]+$/, "");
  const normalized = baseName.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  if (!normalized) return "Marca";

  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function Seccion_1() {
  const [pausado, setPausado] = useState(false);
  const [direccion, setDireccion] = useState<"normal" | "reverse">("normal");
  const [marcas, setMarcas] = useState<MarcaItem[]>([]);
  const pistaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cargarMarcas = async () => {
      try {
        const data = await listarMarcas();
        const marcasMapeadas: MarcaItem[] = (data as Marca[]).map((marca) => ({
          id: marca.marcaid,
          nombre: buildDisplayName(marca.marcanombre, `Marca ${marca.marcaid}`),
          imagen: marca.marcaimgnombrebucket
          ? supabase.storage
              .from("imagenes")
              .getPublicUrl(`marca/${marca.marcaimgnombrebucket}`).data.publicUrl
          : "",
        }));
        setMarcas(marcasMapeadas);
      } catch (error) {
        console.error("No se pudieron cargar las marcas:", error);
        setMarcas([]);
      }
    };
    cargarMarcas();
  }, []);

  // Reinicia la animación CSS cuando cambia la dirección
  useEffect(() => {
    const pista = pistaRef.current;
    if (!pista) return;

    // Forzar reflow para reiniciar la animación
    pista.style.animation = "none";
    void pista.offsetHeight; // trigger reflow
    pista.style.animation = "";
    pista.style.animationDirection = direccion;
  }, [direccion]);

  const marcasLoop = useMemo(() => {
    if (marcas.length === 0) return [];
    return [...marcas, ...marcas];
  }, [marcas]);

  return (
    <section
      className={styles.seccion}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      <button
        type="button"
        className={styles.flecha}
        onClick={() => setDireccion("reverse")}
        aria-label="Anterior"
      >
        {"<"}
      </button>

      <div className={styles.carrusel}>
        {marcasLoop.length > 0 ? (
          <div
            ref={pistaRef}
            className={`${styles.pista} ${pausado ? styles.pistaPausada : ""}`}
            style={{ animationDirection: direccion }}
          >
            {marcasLoop.map((marca, index) => (
              <article key={`${marca.id}-${index}`} className={styles.logoCard}>
                {marca.imagen ? (
                  <img
                    src={marca.imagen}
                    alt={marca.nombre}
                    className={styles.logo}
                  />
                ) : (
                  <div className={styles.logoPlaceholder}>{marca.nombre}</div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.vacio}>No hay marcas disponibles.</div>
        )}
      </div>

      <button
        type="button"
        className={styles.flecha}
        onClick={() => setDireccion("normal")}
        aria-label="Siguiente"
      >
        {">"}
      </button>
    </section>
  );
}