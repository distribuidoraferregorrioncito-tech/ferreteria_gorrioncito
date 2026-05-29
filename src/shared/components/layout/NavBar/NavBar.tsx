import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import style from "./NavBar.module.css";
import { icon } from "../../../../core/icons";
import { images } from "../../../../assets/img";
import { NavBarLogo } from "./NavBarLogo";
import { NavBarSearch } from "./NavBarSearch";
import { NavBarCategoria } from "./NavBarCategoria";
import { NavBarCotizar } from "./NavBarCotizar";

type CartItem = {
  id: string | number;
  titulo: string;
  categoria: string;
  imagen: string;
  cantidad: number;
};

const STORAGE_KEY = "cartItems";

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

export default function NavBar() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollTop = () => window.scrollTo({ top: 0 });

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

  const closeMenu = () => {
    scrollTop();
    setMenuOpen(false);
  };

  return (
    <div className={style.wrapper}>
      <header className={style.navbar}>
        <div className={style.logoRow}>
          <NavBarLogo />
        </div>

        <div className={style.searchRow}>
          <NavBarSearch />
          <button
            className={style.hamburger}
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menú"
          >
            ☰
          </button>
        </div>

        {/* Desktop */}
        <nav className={style.menuDesktop}>
          <Link to="/nosotros" className={style.link} onClick={scrollTop}>
            Nosotros
          </Link>
          <Link to="/product" className={style.link} onClick={scrollTop}>
            Productos
          </Link>
          <NavBarCategoria />
        </nav>

        <div className={style.actionsDesktop}>
          <NavBarCotizar />
          <Link to="/cart" className={style.cartButton}>
            {icon.iconCarrito({ className: style.carritoIcon })}
            {totalItems > 0 && (
              <span className={style.cartCount}>{totalItems}</span>
            )}
          </Link>
        </div>

        {/* Mobile drawer */}
        {menuOpen && (
          <>
            <div className={style.overlay} onClick={() => setMenuOpen(false)} />

            <aside className={style.drawer}>
              {/* Logo hamburguesa */}
              <div className={style.drawerLogo}>
                <img
                  src={images.logoHamburguesa}
                  alt="Logo"
                  className={style.drawerLogoImg}
                />
              </div>

              <Link to="/nosotros" className={style.drawerLink} onClick={closeMenu}>
                Nosotros
              </Link>

              <Link to="/product" className={style.drawerLink} onClick={closeMenu}>
                Productos
              </Link>

              <NavBarCotizar />

              <Link to="/cart" className={style.cartButtonMobile} onClick={closeMenu}>
                {icon.iconCarrito({ className: style.carritoIcon })}
                Carrito ({totalItems})
              </Link>
            </aside>
          </>
        )}
      </header>
    </div>
  );
}