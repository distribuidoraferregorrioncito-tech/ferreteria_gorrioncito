import { useEffect, useMemo, useState } from "react";
import style from "./seccion_3.module.css";

import {
  getImagenMarca,
  listarMarcas,
} from "../../../../core/services/marca.service";
import { Marca } from "../../../../core/types"

const Seccion_3 = () => {
  const [marcas, setMarcas] = useState<Marca[]>([]);

  useEffect(() => {
    listarMarcas()
      .then((data) => setMarcas(data as Marca[]))
      .catch((error) => {
        console.error("Error al cargar marcas:", error);
        setMarcas([]);
      });
  }, []);

  const marcasDuplicadas = useMemo(() => {
    if (marcas.length === 0) return [];
    return [...marcas, ...marcas];
  }, [marcas]);

  return (
    <section className={style.seccion}>

      {/* Carrusel derecha */}
      <div className={style.carruselMarco}>
        <button className={`${style.flecha} ${style.flechaIzquierda}`} type="button">&#8249;</button>
        <div className={style.viewport}>
          {marcasDuplicadas.length > 0 ? (
            <div className={style.pistaDerecha}>
              {marcasDuplicadas.map((marca, index) => {
                const imagen = marca.marcaimgnombrebucket
                  ? getImagenMarca(marca.marcaimgnombrebucket)
                  : "";
                const nombre = marca.marcanombre
                  ?.replace(/\.[^.]+$/, "")
                  ?.replace(/[_-]+/g, " ")
                  ?.trim()
                  ?.replace(/\b\w/g, (c) => c.toUpperCase())
                  ?? `Marca ${marca.marcaid}`;

                return (
                  <article key={`${marca.marcaid}-${index}`} className={style.card}>
                    {imagen ? (
                      <img src={imagen} alt={nombre} className={style.imagen} />
                    ) : (
                      <div className={style.placeholder}>{nombre}</div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className={style.vacio}>No hay marcas disponibles.</div>
          )}
        </div>
        <button className={`${style.flecha} ${style.flechaDerecha}`} type="button">&#8250;</button>
      </div>

      {/* Encabezado */}
      <div className={style.encabezado}>
        <h2 className={style.titulo}>Marcas</h2>
        <p className={style.descripcion}>
          Trabajamos con marcas reconocidas para ofrecer productos confiables en cada categoria.
        </p>
      </div>

      {/* Carrusel izquierda */}
      <div className={style.carruselMarco}>
        <button className={`${style.flecha} ${style.flechaIzquierda}`} type="button">&#8249;</button>
        <div className={style.viewport}>
          {marcasDuplicadas.length > 0 ? (
            <div className={style.pistaIzquierda}>
              {marcasDuplicadas.map((marca, index) => {
                const imagen = marca.marcaimgnombrebucket
                  ? getImagenMarca(marca.marcaimgnombrebucket)
                  : "";
                const nombre = marca.marcanombre
                  ?.replace(/\.[^.]+$/, "")
                  ?.replace(/[_-]+/g, " ")
                  ?.trim()
                  ?.replace(/\b\w/g, (c) => c.toUpperCase())
                  ?? `Marca ${marca.marcaid}`;

                return (
                  <article key={`${marca.marcaid}-${index}`} className={style.card}>
                    {imagen ? (
                      <img src={imagen} alt={nombre} className={style.imagen} />
                    ) : (
                      <div className={style.placeholder}>{nombre}</div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className={style.vacio}>No hay marcas disponibles.</div>
          )}
        </div>
        <button className={`${style.flecha} ${style.flechaDerecha}`} type="button">&#8250;</button>
      </div>

    </section>
  );
};

export default Seccion_3;