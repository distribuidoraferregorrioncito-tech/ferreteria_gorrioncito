import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import styles from "./seccion_1.module.css";
import { supabase } from "../../../../lib/supabase";
import { DEFAULT_BANNER_IMAGE, getField, resolveImageSource } from "../../../../shared/utils/catalogImage";

type SlideItem = {
  src: string;
  link: string;
  nombre: string;
};

const DEFAULT_BUCKET_NAME = "BannerFerreteria";
const slideLinks = ["/", "/product", "/nosotros", "/cart"];

const Seccion_1 = () => {
  const [slides, setSlides] = useState<SlideItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");

  const getStorageUrl = (bucketName: string | null, fileName: string | null) => {
    if (!bucketName || !fileName) return null;

    const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
    return data?.publicUrl ?? null;
  };

  useEffect(() => {
    const cargarSlides = async () => {
      setCargando(true);
      setErrorCarga("");

      const { data: secciones, error: seccionesError } = await supabase
        .from("seccion1")
        .select("*");

      if (seccionesError) {
        console.error("No se pudieron cargar las secciones de banners:", seccionesError.message);
        setErrorCarga("No se pudieron cargar los banners.");
        setCargando(false);
        return;
      }

      const seccionesActivas = (secciones ?? [])
        .filter((item) => Boolean(getField(item, "sc1UsarStorage", "sc1usarstorage")))
        .sort((a, b) => {
          const aId = getField<number>(a, "sc1Id", "sc1id") ?? 0;
          const bId = getField<number>(b, "sc1Id", "sc1id") ?? 0;
          return aId - bId;
        });

      const bannerIds = seccionesActivas
        .map((item) => getField<number>(item, "bannerId", "bannerid"))
        .filter(Boolean);

      if (bannerIds.length === 0) {
        setSlides([]);
        setCargando(false);
        return;
      }

      const { data: bannersData, error: bannersError } = await supabase
        .from("banner")
        .select("*");

      if (bannersError) {
        console.error("No se pudieron cargar los banners:", bannersError.message);
        setErrorCarga("No se pudieron cargar los banners.");
        setCargando(false);
        return;
      }

      const bannerMap = new Map(
        (bannersData ?? [])
          .filter((banner) => {
            const id = getField<number>(banner, "bannerId", "bannerid", "id");
            return id !== null && bannerIds.includes(id);
          })
          .map((banner) => [getField<number>(banner, "bannerId", "bannerid", "id"), banner])
      );

      const banners = seccionesActivas
        .map((item, index) => {
          const bannerId = getField<number>(item, "bannerId", "bannerid");
          const banner = bannerMap.get(bannerId);
          if (!banner) return null;

          const usaStorage = Boolean(getField(item, "sc1UsarStorage", "sc1usarstorage"));
          const bucketName = getField<string>(
            banner,
            "bannerBucket",
            "bannerbucket",
            "bucket",
            "bucketName"
          ) || DEFAULT_BUCKET_NAME;
          const fileName = getField<string>(banner, "bannerBucketNombre", "bannerbucketnombre");
          const nombre = getField<string>(banner, "bannerNombre", "bannernombre");
          const bannerLink = getField<string>(banner, "bannerLink", "bannerlink");

          const src = resolveImageSource({
            directUrl: usaStorage ? null : bannerLink,
            bucketName,
            fileName,
            defaultImage: DEFAULT_BANNER_IMAGE,
            getStorageUrl,
          });

          return {
            src,
            link: bannerLink || slideLinks[index % slideLinks.length],
            nombre: nombre || `Banner ${index + 1}`,
          };
        })
        .filter((item): item is SlideItem => Boolean(item));

      setSlides(banners);
      setCurrentIndex(0);
      setCargando(false);
    };

    cargarSlides();
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? slides.length - 1 : prev - 1
    );
  };

  useEffect(() => {
    if (slides.length === 0) return undefined;

    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length]);

  if (cargando) {
    return (
      <section className={styles.carousel}>
        <div className={styles.emptyState}>Cargando banners...</div>
      </section>
    );
  }

  const slideActivo = slides[currentIndex];

  if (!slideActivo || slides.length === 0) {
    return (
      <section className={styles.carousel}>
        <div className={styles.emptyState}>
          {errorCarga || "No hay banners disponibles."}
        </div>
      </section>
    );
  }

  const esLinkExterno = /^https?:\/\//i.test(slideActivo.link);

  return (
    <section className={styles.carousel}>

      {/* Flecha izquierda */}
      <button
        className={styles.arrowLeft}
        onClick={prevSlide}
      >
        ❮
      </button>

      {/* Imagen clickeable */}
      {esLinkExterno ? (
        <a href={slideActivo.link} target="_blank" rel="noreferrer">
          {slideActivo.src ? (
            <img
              src={slideActivo.src}
              alt={`Imagen ${currentIndex + 1}`}
              className={styles.carouselImage}
            />
          ) : (
            <div className={styles.imagePlaceholder}>{slideActivo.nombre}</div>
          )}
        </a>
      ) : (
        <Link to={slideActivo.link}>
          {slideActivo.src ? (
            <img
              src={slideActivo.src}
              alt={`Imagen ${currentIndex + 1}`}
              className={styles.carouselImage}
            />
          ) : (
            <div className={styles.imagePlaceholder}>{slideActivo.nombre}</div>
          )}
        </Link>
      )}

      {/* Flecha derecha */}
      <button
        className={styles.arrowRight}
        onClick={nextSlide}
      >
        ❯
      </button>

      {/* Indicadores */}
      <div className={styles.indicators}>
        {slides.map((_, index) => (
          <div
            key={index}
            className={`${styles.dot} ${
              index === currentIndex ? styles.active : ""
            }`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>

    </section>
  );
};

export default Seccion_1;
