import style from "./NavBarLogo.module.css";
import { Link } from "react-router-dom";
import { images } from "../../../../assets/img";

export const NavBarLogo = () => {
  return (
    <Link to="/" className={style.company}>
      <img
        src={images.logoGorrion}
        alt="Logo Gorrioncito"
        className={style.logoCompany}
      />  
      <div className={style.nameCompany}>
        <h3><b>Gorrioncito</b></h3>
        <p>Distribuidora y Ferreteria</p>
      </div>
    </Link>
  );
};