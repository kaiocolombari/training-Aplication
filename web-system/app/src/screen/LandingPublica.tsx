import { Link } from "react-router";
import { BsActivity, BsArrowUpRight, BsChatDots, BsShieldCheck } from "react-icons/bs";

const whatsappUrl = import.meta.env.VITE_WHATSAPP_CONTACT_URL?.trim();

export default function LandingPublica() {
    return (
        <main className="relative isolate min-h-screen overflow-hidden bg-[#101512] text-white">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_75%_10%,rgba(168,95,96,.24),transparent_40%),radial-gradient(ellipse_at_5%_90%,rgba(200,239,115,.10),transparent_38%),linear-gradient(135deg,#101512,#1b211d)]" />
            <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-7 lg:px-10">
                <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#a85f60]"><BsActivity size={21} /></span>
                    <span className="text-[13px] font-black tracking-[.2em]">TREINO <span className="text-[#c8ef73]">SYSTEM</span></span>
                </div>
                <Link to="/register" className="rounded-xl border border-white/15 px-5 py-2.5 text-xs font-bold text-white/80 transition hover:border-white/40 hover:bg-white/5">Entrar na conta</Link>
            </header>

            <section className="mx-auto grid min-h-[calc(100vh-100px)] w-full max-w-7xl items-center gap-14 px-6 pb-20 pt-10 lg:grid-cols-[1.1fr_.9fr] lg:px-10">
                <div className="max-w-2xl">
                    <p className="mb-5 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.24em] text-[#c8ef73]"><span className="h-px w-8 bg-[#c8ef73]" /> Acompanhamento em equipe</p>
                    <h1 className="text-[clamp(42px,7vw,82px)] font-black leading-[.98] tracking-[-.065em]">Seu treino. <span className="text-[#c8ef73]">Sua evolução.</span> Uma equipe ao seu lado.</h1>
                    <p className="mt-7 max-w-xl text-[14px] leading-7 text-white/55">Acesse seu planejamento, registre cada sessão e acompanhe sua evolução com uma equipe de profissionais trabalhando em conjunto.</p>
                    <div className="mt-9 flex flex-wrap gap-3">
                        {whatsappUrl ? (
                            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 rounded-xl bg-[#c8ef73] px-6 py-4 text-xs font-black text-[#17211b] transition hover:-translate-y-0.5 hover:bg-[#d7f69a]">Solicitar convite <BsArrowUpRight size={16} /></a>
                        ) : (
                            <div className="max-w-sm rounded-xl border border-amber-300/20 bg-amber-300/5 px-5 py-4 text-xs leading-5 text-amber-100/80">Para criar sua conta, converse com um profissional da equipe e solicite um link de convite.</div>
                        )}
                        <Link to="/register" className="inline-flex items-center gap-3 rounded-xl border border-white/15 px-6 py-4 text-xs font-bold text-white/80 transition hover:bg-white/5">Já tenho acesso <BsArrowUpRight size={15} /></Link>
                    </div>
                    <div className="mt-12 flex flex-wrap gap-x-7 gap-y-3 text-[10px] font-semibold text-white/40">
                        <span className="flex items-center gap-2"><BsShieldCheck size={14} className="text-[#c8ef73]" /> Cadastro somente por convite</span>
                        <span className="flex items-center gap-2"><BsChatDots size={14} className="text-[#c8ef73]" /> Equipe integrada</span>
                    </div>
                </div>

                <div className="relative mx-auto w-full max-w-[510px]">
                    <div className="absolute -inset-8 rounded-[42px] bg-[#a85f60]/10 blur-3xl" />
                    <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[.045] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
                        <div className="flex items-center justify-between border-b border-white/10 pb-5">
                            <div><p className="text-[9px] font-bold uppercase tracking-[.2em] text-white/35">Seu acompanhamento</p><p className="mt-1 text-lg font-extrabold">Tudo conectado.</p></div>
                            <span className="rounded-full bg-[#c8ef73]/10 px-3 py-1.5 text-[9px] font-bold text-[#c8ef73]">EM EQUIPE</span>
                        </div>
                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <div className="rounded-2xl bg-black/20 p-4"><p className="text-[9px] font-bold uppercase tracking-wider text-white/35">Planejamento</p><p className="mt-3 text-sm font-bold">Treinos organizados</p><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-3/4 rounded-full bg-[#c8ef73]" /></div></div>
                            <div className="rounded-2xl bg-black/20 p-4"><p className="text-[9px] font-bold uppercase tracking-wider text-white/35">Evolução</p><p className="mt-3 text-sm font-bold">Histórico completo</p><div className="mt-4 flex h-6 items-end gap-1"><span className="h-2 w-2 rounded-sm bg-[#a85f60]"/><span className="h-3 w-2 rounded-sm bg-[#a85f60]"/><span className="h-4 w-2 rounded-sm bg-[#c8ef73]"/><span className="h-5 w-2 rounded-sm bg-[#c8ef73]"/><span className="h-6 w-2 rounded-sm bg-[#c8ef73]"/></div></div>
                        </div>
                        <div className="mt-3 rounded-2xl bg-black/20 p-4">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-white/35">Acompanhamento integrado</p>
                            <div className="mt-4 flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-[#a85f60]/25 text-xs font-black text-[#e7b7b8]">TS</div><div className="flex-1"><p className="text-xs font-bold">Profissionais em conjunto</p><p className="mt-1 text-[9px] text-white/35">Registros e alterações com histórico</p></div><BsShieldCheck size={17} className="text-[#c8ef73]" /></div>
                        </div>
                        <p className="mt-6 text-center text-[9px] text-white/30">O acesso é liberado após análise do cadastro pela equipe.</p>
                    </div>
                </div>
            </section>
        </main>
    );
}
