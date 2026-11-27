import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../context/authContext";
import { ApiError } from "../service/api";
import { Skeleton } from "./Skeleton";

function destinoDoUsuario(user: NonNullable<ReturnType<typeof useAuth>["user"]>) {
    if (user.tipo === "ALUNO") {
        return user.statusCadastro === "APROVADO"
            ? "/cadastro/app"
            : user.statusCadastro === "REPROVADO"
              ? "/cadastro/formulario"
            : user.formularioEnviado
              ? "/cadastro/aguardando"
              : "/cadastro/formulario";
    }

    return user.tipo === "ADMIN" || user.tipo === "PERSONAL" ? "/" : "/acesso-negado";
}

export default function PublicOnlyLayout() {
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
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <Skeleton className="mt-6 h-3 w-36" />
                    <Skeleton className="mt-3 h-3 w-full" />
                    <p className="mt-5 text-[11px] font-medium text-zinc-500">
                        Conferindo se você já está conectado...
                    </p>
                </section>
            </main>
        );
    }

    if (user) return <Navigate to={destinoDoUsuario(user)} replace />;

    if (isError && !(error instanceof ApiError && error.status === 401)) {
        return (
            <main className="grid min-h-screen place-items-center bg-[#f7f7f7] px-6">
                <section
                    role="alert"
                    className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-7 text-center shadow-xl shadow-zinc-900/5"
                >
                    <h1 className="text-lg font-semibold text-zinc-800">
                        Não foi possível validar sua sessão
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-zinc-500">
                        Tente novamente antes de entrar com outra conta.
                    </p>
                    <button
                        type="button"
                        onClick={() => void retrySession()}
                        className="mt-5 rounded-xl bg-[#a85f60] px-5 py-3 text-xs font-semibold text-white transition hover:bg-[#914f50]"
                    >
                        Tentar novamente
                    </button>
                </section>
            </main>
        );
    }

    return (
        <div key={location.pathname} className="route-enter">
            <Outlet />
        </div>
    );
}
