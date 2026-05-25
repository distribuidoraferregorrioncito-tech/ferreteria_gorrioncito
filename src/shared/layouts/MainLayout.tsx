import { Outlet } from "react-router-dom";


interface Props {
    currentUser: any;
    onLogout: () => void;
}

export function MainLayout({ currentUser, onLogout }: Props) {
    return (
        <div className="flex h-screen bg-background">
            
        </div>
    );
}
