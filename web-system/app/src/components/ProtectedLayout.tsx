import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../context/authContext";

export default function ProtectedLayout() {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <main className="grid min-h-screen place-items-center bg-[#f7f7f7] px-6">
                <div className="flex items-center gap-3 text-sm text-zinc-500">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-[#a85f60]" />
                    Verificando sua sessão...
                </div>
            </main>
        );
    }

    if (!user) {
        return <Navigate to="/register" replace state={{ from: location.pathname }} />;
    }

    if (user.tipo === "ALUNO") {
        const destino = user.statusCadastro === "APROVADO"
            ? "/cadastro/app"
            : user.formularioEnviado
                ? "/cadastro/aguardando"
                : "/cadastro/formulario";

        return location.pathname === destino
            ? <Outlet />
            : <Navigate to={destino} replace />;
    }

    if (location.pathname.startsWith("/cadastro/")) {
        return <Navigate to="/" replace />;
    }

    if (user.tipo !== "PERSONAL" && user.tipo !== "ADMIN") {
        return <Navigate to="/register" replace />;
    }

    return <Outlet />;
}
