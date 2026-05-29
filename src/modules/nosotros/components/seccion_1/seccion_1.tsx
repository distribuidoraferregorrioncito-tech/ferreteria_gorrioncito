import styles from "./seccion_1.module.css";
import { images } from "./../../../../assets/img/index.js";
import { icon } from "./../../../../core/icons/";

export default function Seccion_1() {
  return (
    <section className={styles.seccion}>
      <div className={styles.wrapper}>

        {/* Texto */}
        <div className={styles.texto}>
          <h2 className={styles.titulo}>QUIENES SOMOS</h2>
          <p className={styles.subtitulo}>
            Distribucion tecnica y comercial con enfoque en industria,
            construccion y seguridad.
          </p>
          <p className={styles.descripcion}>
            Somos una empresa peruana que se dedica a la distribucion y
            comercializacion de productos para los sectores de la industria:
            mineria, construccion civil, pesquera, agricultura, entre otras
            industrias.
          </p>

          <div className={styles.resumenGrid}>
            <div className={styles.resumenCard}>
              <strong>Atencion directa</strong>
              <span>Respuesta agil para cotizaciones y consultas comerciales.</span>
            </div>
            <div className={styles.resumenCard}>
              <strong>Cobertura amplia</strong>
              <span>Marcas, herramientas y lineas tecnicas para obra e industria.</span>
            </div>
          </div>

          <div className={styles.contactoGrid}>
            <div className={styles.contactoCard}>
              {icon.iconTelefono({ className: styles.contactoIcono })}
              <div>
                <h3>Contactanos</h3>
                <p>915 144 663</p>
              </div>
            </div>
            <div className={styles.contactoCard}>
              {icon.iconCorreo({ className: styles.contactoIcono })}
              <div>
                <h3>Correo</h3>
                <p>distribuidoraferrorgorrioncito@gmail.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* Imagen */}
        <div className={styles.visual}>
          <img
            src={images.FLYER2}
            alt="Imagen corporativa"
            className={styles.imagen}
          />
        </div>

      </div>
    </section>
  );
}