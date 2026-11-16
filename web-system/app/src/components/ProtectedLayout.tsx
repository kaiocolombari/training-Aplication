import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../context/authContext";
import { ApiError } from "../service/api";
import { Skeleton } from "./Skeleton";

export default function ProtectedLayout() {
    const { user, isLoading, isError, error, retrySession } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <main className="grid min-h-screen place-items-center bg-[#f7f7f7] px-6">
                <section
                    aria-live="polite"
                    aria-busy="true"
                    className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-900/5"
                >
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-xl" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-3 w-32" />
                            <Skeleton className="h-2.5 w-48" />
                        </div>
                    </div>
                    <Skeleton className="mt-7 h-2.5 w-full" />
                    <Skeleton className="mt-3 h-2.5 w-4/5" />
                    <p className="mt-5 text-[11px] font-medium text-zinc-500">
                        Verificando sua sessão segura...
                    </p>
                </section>
            </main>
        );
    }

    if (!user && isError && !(error instanceof ApiError && error.status === 401)) {
        return (
            <main className="grid min-h-screen place-items-center bg-[#f7f7f7] px-6">
                <section
                    role="alert"
                    className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-7 text-center shadow-xl shadow-zinc-900/5"
                >
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a85f60]">
                        Conexão indisponível
                    </p>
                    <h1 className="mt-3 text-xl font-semibold tracking-tight text-zinc-800">
                        Não foi possível verificar sua sessão
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-zinc-500">
                        Não vamos encerrar seu acesso por uma falha temporária. Verifique a conexão
                        e tente novamente.
                    </p>
                    <button
                        type="button"
                        onClick={() => void retrySession()}
                        className="mt-6 rounded-xl bg-[#a85f60] px-5 py-3 text-xs font-semibold text-white transition hover:bg-[#914f50]"
                    >
                        Tentar novamente
                    </button>
                </section>
            </main>
        );
    }

    if (!user) {
        return <Navigate to="/register" replace state={{ from: location.pathname }} />;
    }

    if (location.pathname === "/acesso-negado") {
        return (
            <div key={location.pathname} className="route-enter">
                <Outlet />
            </div>
        );
    }

    if (user.tipo === "ALUNO") {
        const destino =
            user.statusCadastro === "APROVADO"
                ? "/cadastro/app"
                : user.formularioEnviado
                  ? "/cadastro/aguardando"
                  : "/cadastro/formulario";

        return location.pathname === destino ? (
            <div key={location.pathname} className="route-enter">
                <Outlet />
            </div>
        ) : (
            <Navigate to={destino} replace />
        );
    }

    if (location.pathname.startsWith("/cadastro/")) {
        return <Navigate to="/" replace />;
    }

    if (user.tipo !== "PERSONAL" && user.tipo !== "ADMIN") {
        return <Navigate to="/register" replace />;
    }

    return (
        <div key={location.pathname} className="route-enter">
            <Outlet />
        </div>
    );
}
