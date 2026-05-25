import styles from "./seccion_3.module.css";

export default function Seccion_3() {
  return (
    <section className={styles.seccion}>
      <div className={styles.contenido}>
        <article className={styles.bloque}>
          <h2 className={styles.titulo}>MISIÓN</h2>
          <p className={styles.texto}>
            Brindar seguridad a nuestros potenciales clientes y sus colaboradores
            a traves de la amplia gama de marcas y productos de calidad que
            comercializamos para su uso y proteccion para el buen desempeno
            laboral.
          </p>
        </article>

        <article className={styles.bloque}>
          <h2 className={styles.titulo}>VISIÓN</h2>
          <p className={styles.texto}>
            Ser una empresa reconocida y lider en el mercado en la distribucion y
            comercio de las mejores marcas de productos de seguridad personal y
            ferreteria. Brindandole al cliente el asesoramiento y capacitacion
            para el debido y adecuado uso de los productos que adquiere en
            nuestra empresa.
          </p>
        </article>
      </div>
    </section>
  );
}
