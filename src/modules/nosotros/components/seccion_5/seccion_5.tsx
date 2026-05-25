import styles from "./seccion_5.module.css";
import { images } from "../../../../assets/img/index";

import historia from "../../../../assets/pdf/HISTORIA.pdf";

import { useEffect, useRef, useState } from "react";

export default function Seccion_4() {

  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {

  function handleClickOutside(event) {

    if (
      menuRef.current &&
      !menuRef.current.contains(event.target)
    ) {
      setOpen(false);
    }

  }

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener(
      "mousedown",
      handleClickOutside
    );
  };

}, []);
  return (
    <section className={styles.seccion}>
      <h2 className={styles.titulo}>
        LA HISTORIA DE UN EMPRENDIMIENTO
      </h2>

      <div className={styles.historiaContainer}>

        <div ref={menuRef}>

  <button
    className={styles.menuBtn}
    onClick={() => setOpen(!open)}
  >
    ⋮
  </button>

  {open && (
    <div className={styles.menu}>
      <a href={historia} download>
        Descargar PDF
      </a>
    </div>
  )}

</div>


        <p className={styles.autor}>por: David Alfonso</p>

      <hr />

      <div className={styles.logoTitulo}>
        <h2>GORRIONCITO</h2>
        <hr />
      </div>

      <div className={styles.comunidadSection}>
        <h3>CONÉCTATE CON NUESTRA COMUNIDAD</h3>
        <hr />

        <div className={styles.historiaGrid}>
          <div className={styles.historiaCard}>
            <h4>EL INICIO</h4>
            <hr />
            <p>
              La historia de gorrioncito comenzó en el año 2015 con la idea de la venta de ladrillos, visitando a las pequeñas obras, ofreciendo los distintos tipos de ladrillos puesto en obras. Y así poco a poco con la confianza de cada cliente se empezó a adicionar más materiales para la venta.
            </p>
          </div>

          <div className={styles.historiaCard}>
            <h4>EL CRECIMIENTO</h4>
            <hr />
            <p>
              En el año 2016 ya se empezó a abrir una pequeña ferretería, se inició como persona natural y distribuyendo materiales a más obras.
              En el año 2018 ya la empresa empezó a crecer más, cambiándose a persona jurídica y empezó a trabajar con más entidades.
            </p>
          </div>
        </div>

        <div className={styles.historiaGrid}>
          <div className={styles.historiaCard}>
            <hr />
            <h4>EL COMIENZO DE LA PANDEMIA</h4>
            <hr />
            <p>
             <b>6 de marzo del 2020</b> <br />
              En el inicio de la pandemia no fue un obstáculo para el crecimiento de la ferretería gorrioncito. El programa REACTIVA fue uno de los impulsos de apoyo para el crecimiento de la ferretería ya que se inició con más oportunidades y mejorías para la nueva empresa.
              Gracias a estas oportunidades la empresa fue cada vez crecimiento mucho más y las oportunidades seguían.
            </p>
          </div>

          <div><img src={images.historiaGorrioncito} alt="Historia Gorrion" /></div>
        </div>
        <div className={styles.historiaGrid}>
          <div className={styles.historiaCard}>
            <hr />  
            <h4>RECURSOS HUMANOS</h4>
            <hr />
            <p>
             <b>El primer almacén</b> <br />
              En el año 2020 la empresa no se quedaría ahí, y comenzarían con el inicio del primer almacén, ya con el primer almacén las ventas subirían mucho más y poco tiempo después se compraría la nueva movilidad para la entrega de las ventas.
            </p>
          </div>

          <div className={styles.historiaCard}>
            <hr />
            <h4>FINANZAS</h4>
            <hr />
            <p>
             <b>Gorrioncito en la actualidad</b> <br />
              Actualmente la empresa cuenta con una tienda principal y 2 almacenes, ofrecemos la venta de materiales de construcción, agregados, alquileres de maquinarias y más. En estos últimos años gorrioncito se volvió una empresa sólida, que está puesta a servir a todos nuestros clientes en general.
            </p>
          </div>
        </div>
        
      </div>
    </div>
    </section>
  );
}
