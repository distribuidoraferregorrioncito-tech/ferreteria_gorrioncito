import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import style from "./NavBarSearch.module.css";
import { icon } from "../../../../core/icons";

import { clasificarBusquedaCatalogo } from "../../../../core/services/index";

export const NavBarSearch = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [busquedaNavbar, setBusquedaNavbar] = useState(searchParams.get("q") ?? "");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    setBusquedaNavbar(searchParams.get("q") ?? "");
  }, [searchParams]);

  const manejarSubmitBusqueda = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = busquedaNavbar.trim();

    if (!query) {
      navigate("/product");
      return;
    }

    setCargando(true);
    try {
      const resultado = await clasificarBusquedaCatalogo(query);

      switch (resultado.tipo) {
        case "marca":
          navigate(`/product?marca=${encodeURIComponent(resultado.valor)}`);
          break;
        case "categoria":
          navigate(`/product?categoria=${encodeURIComponent(resultado.valor)}`);
          break;
        case "producto":
        case "sin_resultado":
          navigate(`/product?q=${encodeURIComponent(resultado.valor)}`);
          break;
      }
    } catch (err) {
      console.error("Error al clasificar búsqueda:", err);
      navigate(`/product?q=${encodeURIComponent(query)}`);
    } finally {
      setCargando(false);
    }
  };

  return (
    <form className={style.searchBox} onSubmit={manejarSubmitBusqueda}>
      <button
        type="submit"
        className={style.searchButton}
        aria-label="Buscar productos"
        disabled={cargando}
      >
        {icon.iconLupa({ className: style.modalLupa })}
      </button>
      <input
        type="text"
        placeholder="Buscar productos, categorías y marcas"
        className={style.searchInput}
        value={busquedaNavbar}
        onChange={(e) => setBusquedaNavbar(e.target.value)}
        disabled={cargando}
      />
    </form>
  );
};