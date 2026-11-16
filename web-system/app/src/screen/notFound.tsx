import { Link } from "react-router";
import { BsCompass } from "react-icons/bs";

export default function NotFound() {
    return (
        <main className="grid min-h-[65vh] place-items-center px-5 py-12">
            <section className="max-w-md text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]"><BsCompass size={24} /></span>
                <p className="mt-5 text-[10px] font-bold uppercase tracking-[.18em] text-[var(--accent-text)]">Erro 404</p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Esta página não existe</h1>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">O endereço pode estar incorreto ou a página foi movida.</p>
                <Link to="/" className="mt-6 inline-flex rounded-xl bg-[var(--accent)] px-5 py-3 text-xs font-semibold text-white transition hover:bg-[var(--accent-hover)]">Voltar ao painel</Link>
            </section>
        </main>
    );
}
