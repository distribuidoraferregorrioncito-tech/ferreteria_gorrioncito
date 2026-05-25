import { Navigate } from "react-router-dom";
import { isTokenValid } from "./auth";
import { JSX } from "react";


interface ProtectedRouteProps {
    children: JSX.Element;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    if (!isTokenValid()) {
        return <Navigate to="/" replace />;
    }
    return children;
};
