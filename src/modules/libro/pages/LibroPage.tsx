import { useEffect, useState } from "react";
import style from "./LibroPage.module.css";
import Seccion_1 from "../components/seccion_1/seccion_1";

export default function LibroPage() {

  return (
    <main className={style.main}>
      <Seccion_1 />
    </main>
  );
}
