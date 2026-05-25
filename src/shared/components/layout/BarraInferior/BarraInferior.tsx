import { useEffect, useState } from "react";
import style from "./BarraInferior.module.css";
import { images } from "../../../../../src/assets/img";
import { icon } from "../../../../../src/core/icons";
import { Link, useNavigate } from "react-router-dom";
import { listarCategorias } from "../../../../core/services/categoria.service";
import { Categoria } from "../../../../core/types"

const whatsappNumber = "51915144663";
const whatsappMessage = "Hola, quiero solicitar una cotizacion.";
const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
const facebookUrl = "https://www.facebook.com/Distribuidoraferregorrioncito/";
const tiktokUrl = "https://www.tiktok.com/@ferreteriagorrioncito0";
const messengerUrl = "https://www.facebook.com/Distribuidoraferregorrioncito/";

const BarraInferior = () => {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  useEffect(() => {
    listarCategorias(1, 5).then(setCategorias);
  }, []);

  const handleCategoriaClick = (nombreCategoria: string) => {
    // "categoria" (singular) es exactamente el param que lee ProductPage
    navigate(`/product?categoria=${encodeURIComponent(nombreCategoria)}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className={style.footer}>
      <div className={style.superior}>
        <div className={style.columna}>
          <div className={style.row}>
            <div className={style.logoWrap}>
              <img src={images.logoGorrion} alt="Logo Gorrioncito" className={style.logo} />
            </div>
            <div className={style.columna}>
              <h3><b>GORRIONCITO</b></h3>
              <p>DISTRIBUIDORA FERRETERA</p>
            </div>
          </div>

          <div>
            <span>
              Tu aliado en soluciones ferreteras. <br />
              Calidad de confianza y compromiso en <br />
              cada producto.
            </span>

            <div className={style.iconos}>
              <a href={facebookUrl} target="_blank" rel="noreferrer"
                className={`${style.icono} ${style.iconoFacebook} ${style.iconoLink}`}
                aria-label="Visitar Facebook">
                <img src={images.facebook} alt="Facebook" className={style.iconoImg} />
              </a>
              <a href={tiktokUrl} target="_blank" rel="noreferrer"
                className={`${style.icono} ${style.iconoFacebook} ${style.iconoLink}`}
                aria-label="Visitar TikTok">
                <img src={images.tiktok} alt="TikTok" className={style.iconoImg} />
              </a>
              <a href={messengerUrl} target="_blank" rel="noreferrer"
                className={`${style.icono} ${style.iconoFacebook} ${style.iconoLink}`}
                aria-label="Visitar Messenger">
                <img src={images.messenger} alt="Messenger" className={style.iconoImg} />
              </a>
              <a href={whatsappUrl} target="_blank" rel="noreferrer"
                className={`${style.icono} ${style.iconoFacebook} ${style.iconoLink}`}
                aria-label="Contactar por WhatsApp">
                <img src={images.whatsapp} alt="Whatsapp" className={style.iconoImg} />
              </a>
            </div>
          </div>
        </div>

        <div>
          <h3 className={style.titulo}>PRODUCTOS</h3>
          <ul>
            {categorias.map((cat) => (
              <li
                key={cat.ctgraid}
                onClick={() => handleCategoriaClick(cat.ctgranombre)}
                style={{ cursor: "pointer" }}
              >
                {">"} {cat.ctgranombre}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className={style.titulo}>LEGAL</h3>
          <Link to="/libroReclamaciones" className={style.listaLegal}>
            {icon.iconHojaPaper({ className: style.iconoHoja })}
            Libro de Reclamaciones
          </Link>
        </div>

        <div>
          <h3 className={style.titulo}>CONTACTO</h3>
          <div className={style.contactos}>
            <p>{icon.iconTelefono({ className: style.iconoTelefono })}+51 915 144 663</p>
            <p>{icon.iconCorreo({ className: style.iconoCorreo })}distribuidoraferrorgorrioncito@gmail.com</p>
            <div className={style.filaDireccion}>
              <p>{icon.iconUbicacion({ className: style.iconoUbicacion })}</p>
              <p>Av. Primero de Noviembre Mza. a Lote. 06 Snc, Quinta Aurora(Frente al Aeropuerto de Mazamari)</p>
            </div>
          </div>
        </div>
      </div>

      <div className={style.inferior}>
        <p>&copy; 2026 Gorrioncito. Todos los derechos reservados.</p>
        <div className={style.lineaVertical}></div>
        <p>RUC:20613860321</p>
        <div className={style.lineaVertical}></div>
        <p>Empresa Individual de Responsabilidad Limitada</p>
      </div>
    </footer>
  );
};

export default BarraInferior;