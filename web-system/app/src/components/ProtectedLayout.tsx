import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../context/authContext";

export default function ProtectedLayout() {
    const { user, isLoading, logout } = useAuth();
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
        return (
            <main className="grid min-h-screen place-items-center bg-[#f7f7f7] px-6 py-10">
                <section className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a85f60]">Conta de aluno</p>
                    <h1 className="mt-3 text-2xl font-bold text-zinc-800">Olá, {user.nome}</h1>
                    <p className="mt-3 text-sm leading-6 text-zinc-600">
                        Sua conta está criada. O painel de gestão é reservado aos personal trainers.
                        O acesso às suas fichas será disponibilizado na área do aluno.
                    </p>
                    <button
                        type="button"
                        onClick={() => void logout()}
                        className="mt-7 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
                    >
                        Sair da conta
                    </button>
                </section>
            </main>
        );
    }

    if (user.tipo !== "PERSONAL" && user.tipo !== "ADMIN") {
        return <Navigate to="/register" replace />;
    }

    return <Outlet />;
}
