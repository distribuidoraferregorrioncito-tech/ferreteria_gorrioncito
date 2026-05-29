import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import style from "./seccion_3.module.css";

import {
  getImagenMarca,
  listarMarcas,
} from "../../../../core/services/marca.service";
import { Marca } from "../../../../core/types";

type Props = {
  onMarcaSeleccionada?: (marca: string) => void;
};

const Seccion_3 = ({ onMarcaSeleccionada }: Props) => {
  const navigate = useNavigate();
  const [marcas, setMarcas] = useState<Marca[]>([]);

  useEffect(() => {
    listarMarcas()
      .then((data) => setMarcas(data as Marca[]))
      .catch((error) => {
        console.error("Error al cargar marcas:", error);
        setMarcas([]);
      });
  }, []);

  // Primera mitad y segunda mitad, cada una duplicada para el loop infinito
  const mitadSuperior = useMemo(() => {
    if (marcas.length === 0) return [];
    const mitad = marcas.slice(0, Math.ceil(marcas.length / 2));
    return [...mitad, ...mitad];
  }, [marcas]);

  const mitadInferior = useMemo(() => {
    if (marcas.length === 0) return [];
    const mitad = marcas.slice(Math.ceil(marcas.length / 2));
    return [...mitad, ...mitad];
  }, [marcas]);

  const renderMarcas = (lista: Marca[], pistaClass: string) => (
    <div className={style.viewport}>
      <div className={pistaClass}>
        {lista.map((marca, index) => {
          const imagen = marca.marcaimgnombrebucket
            ? getImagenMarca(marca.marcaimgnombrebucket)
            : "";
          const nombre =
            marca.marcanombre
              ?.replace(/\.[^.]+$/, "")
              ?.replace(/[_-]+/g, " ")
              ?.trim()
              ?.replace(/\b\w/g, (c) => c.toUpperCase()) ??
            `Marca ${marca.marcaid}`;

          return (
            <article
              key={`${marca.marcaid}-${index}`}
              className={style.card}
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "instant" });
                navigate(`/product?marca=${encodeURIComponent(nombre)}`);
                onMarcaSeleccionada?.(nombre);
              }}
              style={{ cursor: "pointer" }}
            >
              {imagen ? (
                <img src={imagen} alt={nombre} className={style.imagen} />
              ) : (
                <div className={style.placeholder}>{nombre}</div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );

  return (
    <section className={style.seccion}>

      {/* Encabezado */}
      <div className={style.encabezado}>
        <h2 className={style.titulo}>Marcas</h2>
        <p className={style.descripcion}>
          Trabajamos con marcas reconocidas para ofrecer productos confiables en cada categoría.
        </p>
      </div>

      {/* Carrusel superior → derecha */}
      {marcas.length > 0
        ? renderMarcas(mitadSuperior, style.pistaDerecha)
        : <div className={style.vacio}>No hay marcas disponibles.</div>}

      {/* Carrusel inferior → izquierda */}
      {marcas.length > 0 && renderMarcas(mitadInferior, style.pistaIzquierda)}

    </section>
  );
};

export default Seccion_3;