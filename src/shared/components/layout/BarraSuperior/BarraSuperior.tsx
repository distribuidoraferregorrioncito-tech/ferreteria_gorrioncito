import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import styles from "./BarraSuperior.module.css";

export default function BarraSuperior() {

  const [barra, setBarra] = useState(null);

  useEffect(() => {
    obtenerBarra();
  }, []);

  async function obtenerBarra() {
    const { data, error } = await supabase
      .from("barra_superior")
      .select("*")
      .limit(1)
      .single();

    if (error) {
      console.error(error);
      return;
    }

    setBarra(data);
  }

  if (!barra) return null;

  return (
    <div className={styles.barrasuperior}>
      <Link
        to="/juve"
        className={styles.texto}
        style={{ color: barra.color_texto }}
      >
        {barra.texto}
      </Link>
    </div>
  );
}
