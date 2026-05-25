import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { logout } from "../../app/routes/auth"

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

export default function AdminLayout() {
    /* extraer los datos del usuario localstore */
    const [dataUser, setDataUser] = useState<UserData | null>(null);
    /* activar el mbil */
    const [isMobilOpen, setIsMobilOpen] = useState(false)
    const navigate = useNavigate();
    useEffect(() => {
        const usuarioAlmacenado = localStorage.getItem("user");
        if (usuarioAlmacenado) {
            setDataUser(JSON.parse(usuarioAlmacenado));
        }
    }, []);
    const Menu = () => (
        <div className="w-64 bg-card border-r border-border h-full flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-border">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-chart-1 rounded-lg flex items-center justify-center shadow-sm">
                        <img src="data:image/jpeg;base64,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" alt="" />
                    </div>
                    <div>
                        <h1 className="font-semibold text-foreground">Control de Inventario</h1>
                        <p className="text-xs text-muted-foreground">Sistema Integral</p>
                    </div>
                </div>
            </div>
            {/* usuario */}
            <PerfilUsuario />
            <BarraMEnu />
            <Outlet />
            <div className="p-4 border-t border-border/50">


            </div>
        </div>
    );
    const PerfilUsuario = () => (
        <div className="p-4 border-b border-border/50">
            <div className="bg-accent/30 rounded-lg p-3 border border-border/50">
                <div className="flex items-center space-x-3">
                    <div className="relative">

                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                            {dataUser && `${dataUser.nom} ${dataUser.ape}`}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                    
                        </div>
                        {dataUser && (
                            <p className="text-xs text-muted-foreground truncate mt-1">
                                📦 {dataUser.suc}
                            </p>
                        )}
                        {/* <p className="text-xs text-muted-foreground truncate mt-1">
                                ✉️ {currentUser.email}
                            </p> */}
                    </div>
                </div>
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
            <div className="lg:hidden p-2">
                <button onClick={() => setIsMobilOpen(true)} className="bg-primary text-white px-3 py-1 rounded-md">
                    ☰ Menú
                </button>
            </div>
            <div className="hidden lg:block">
                <Menu />
            </div>
        </>
    );
}