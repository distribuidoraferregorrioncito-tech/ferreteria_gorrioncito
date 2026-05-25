import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { logout } from "../../app/routes/auth"

import BarraSuperior from "../components/layout/BarraSuperior/BarraSuperior";
import NavBar from "../components/layout/NavBar/NavBar";
import BarraInferior from "../components/layout/BarraInferior/BarraInferior";
/*estilos*/
// import styles from "../components/layout/Layout.module.css"


/* datos para usuario */
interface UserData {
    id: number;
    ape: string,
    am: string,
    nom: string,
    role: string;
    photo: string;
    state: number;
    suc: string;
};
/* para la vista en mobil */
interface MobilSidebarProps {
    isMobilOpen: Boolean;
    onMobileToggle: (open: boolean) => void;
}

export default function SeeProductLayout() {
    /* extraer los datos del usuario localstore */
    const [dataUser, setDataUser] = useState<UserData | null>(null);
    /* activar el mobil */
    const [isMobilOpen, setIsMobilOpen] = useState(false)
    const navigate = useNavigate();
    useEffect(() => {
        const usuarioAlmacenado = localStorage.getItem("user");
        if (usuarioAlmacenado) {
            setDataUser(JSON.parse(usuarioAlmacenado));
        }
    }, []);
    const Menu = () => (
        <div className="">
            {/* Header */}


            {/* usuario */}

            <Outlet />
            <div className="p-4 border-t border-border/50">

                
            </div>
        </div>
    );

    const BarraMEnu = () => (
        <h1>hola</h1>
    );
    const CerrarSession = () => {
        logout();
        navigate("/")
    }


    return (
        <>
            <div>
                <BarraSuperior />
                
                <NavBar />
                <div className="lg:hidden p-2">
                    <button onClick={() => setIsMobilOpen(true)} className="bg-primary text-white px-3 py-1 rounded-md">
                        ☰ Menú
                    </button>
                </div>
                <div className="hidden lg:block">
                    <Menu />
                </div>
                {/* Mobile Sidebar - Sheet overlay for mobile */}
                <BarraInferior />
            </div>
        </>
    );
}