import { useEffect, useState } from "react";
import style from "./seccion_5.module.css";
import { supabase } from "../../../../lib/supabase";

type VideoItem = {
  id: number;
  titulo: string;
  link: string;
  thumbnail: string;
};

function extraerYoutubeId(url: string) {
  const regexes = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const regex of regexes) {
    const match = url.match(regex);
    if (match) return match[1];
  }
  return null;
}

async function resolverThumbnail(url: string): Promise<string> {
  // YouTube: thumbnail directo sin llamada a API
  const youtubeId = extraerYoutubeId(url);
  if (youtubeId) {
    return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
  }

  // TikTok y Facebook: microlink.io
  try {
    const res = await fetch(
      `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=false`
    );
    const json = await res.json();
    return json?.data?.image?.url ?? json?.data?.screenshot?.url ?? "";
  } catch {
    return "";
  }
}

const Seccion_5 = () => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarTestimonios = async () => {
      const { data, error } = await supabase
        .from("testimonio")
        .select("testid, testlink")
        .eq("testmostrar", true)
        .order("testid", { ascending: true });

      if (error) {
        console.error("Error:", error.message);
        setCargando(false);
        return;
      }

      // Resolvemos todas las thumbnails en paralelo
      const items = await Promise.all(
        (data ?? []).map(async (item) => ({
          id: item.testid,
          titulo: `Testimonio ${item.testid}`,
          link: item.testlink,
          thumbnail: await resolverThumbnail(item.testlink),
        }))
      );

      setVideos(items);
      setCargando(false);
    };

    cargarTestimonios();
  }, []);

  if (cargando || videos.length === 0) return null;

  return (
    <section className={style.seccion}>
      <h2 className={style.titulo}>Testimonios</h2>

      <div className={style.contenedor}>
        {videos.map((video) => (
          <button
            key={video.id}
            type="button"
            className={style.card}
            onClick={() => window.open(video.link, "_blank", "noopener,noreferrer")}
            aria-label={`Abrir ${video.titulo}`}
          >
            <div className={style.thumbWrap}>
              <div className={style.glow} />

              {video.thumbnail ? (
                <img
                  src={video.thumbnail}
                  alt={video.titulo}
                  className={style.thumb}
                />
              ) : (
                <div className={style.thumbFallback}>▶</div>
              )}

              <div className={style.overlay} />
              <div className={style.info}>
                <span className={style.badge}>Cliente real</span>
                <strong className={style.cardTitle}>{video.titulo}</strong>
                <span className={style.cardText}>Ver testimonio completo</span>
              </div>
              <span className={style.play}>
                <span className={style.playTriangle}>&#9654;</span>
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default Seccion_5;