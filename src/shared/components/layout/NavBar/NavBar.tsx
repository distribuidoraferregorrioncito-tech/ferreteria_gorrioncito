import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import style from "./NavBar.module.css";
import { icon } from "../../../../core/icons";
import { NavBarLogo } from "./NavBarLogo";
import { NavBarSearch } from "./NavBarSearch";
import { NavBarCategoria } from "./NavBarCategoria";
import { NavBarCotizar } from "./NavBarCotizar";

// ─── Types ────────────────────────────────────────────────────────────────────

type CartItem = {
  id: string | number;
  titulo: string;
  categoria: string;
  imagen: string;
  cantidad: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "cartItems";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const leerCarrito = (): CartItem[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    const parsed = JSON.parse(data) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function NavBar() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const scrollTop = () => window.scrollTo({ top: 0 });
  // ── Carrito ───────────────────────────────────────────────────────────────

  useEffect(() => {
    setCartItems(leerCarrito());
    const handleCartUpdate = () => setCartItems(leerCarrito());
    window.addEventListener("cartUpdated", handleCartUpdate);
    window.addEventListener("storage", handleCartUpdate);
    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
      window.removeEventListener("storage", handleCartUpdate);
    };
  }, []);

  const totalItems = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.cantidad, 0),
    [cartItems]
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={style.wrapper}>
      <header className={style.navbar}>
        <NavBarLogo/>
        <NavBarSearch />

        <nav className={style.menu}>
          <Link to="/nosotros" className={style.link} onClick={scrollTop}>
            Nosotros
          </Link>
          <Link to="/product" className={style.link} onClick={scrollTop}>
            Productos
          </Link>
          <NavBarCategoria />
        </nav>

        <div className={style.actions}>
          <NavBarCotizar />

          <Link to="/cart" className={style.cartButton} aria-label="Carrito">
            {icon.iconCarrito({ className: style.carritoIcon })}
            {totalItems > 0 && <span className={style.cartCount}>{totalItems}</span>}
          </Link>
        </div>
      </header>
    </div>
  );
}