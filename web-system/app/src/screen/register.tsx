import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import logo from "../assets/logo.png"

export default function Register() {
    const navigate = useNavigate()

    const [nome, setNome] = useState('')
    const [email, setEmail] = useState('')
    const [telefone, setTelefone] = useState('')
    const [senha, setSenha] = useState('')
    const [confirmarSenha, setConfirmarSenha] = useState('')
    const [mostrarSenha, setMostrarSenha] = useState(false)
    const [carregando, setCarregando] = useState(false)

    const handleRegister = async (e: { preventDefault: () => void }) => {
        e.preventDefault()

        if (!nome || !email || !telefone || !senha || !confirmarSenha) {
            alert('Preencha todos os campos.')
            return
        }

        if (senha !== confirmarSenha) {
            alert('As senhas não coincidem.')
            return
        }

        if (senha.length < 6) {
            alert('A senha deve possuir pelo menos 6 caracteres.')
            return
        }

        try {
            setCarregando(true)

            // Futuramente:
            //
            // const response = await fetch(
            //     'http://localhost:xxxx/api/auth/register',
            //     {
            //         method: 'POST',
            //         headers: {
            //             'Content-Type': 'application/json'
            //         },
            //         body: JSON.stringify({
            //             nome,
            //             email,
            //             telefone,
            //             senha
            //         })
            //     }
            // )
            //
            // const data = await response.json()

            console.log({
                nome,
                email,
                telefone,
                senha
            })

            alert('Conta criada com sucesso!')

            navigate('/login')

        } catch (error) {
            console.error(error)
            alert('Erro ao criar a conta.')
        } finally {
            setCarregando(false)
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#ececec] px-4 py-8">
            <div className="w-full max-w-md">

                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-16 items-center justify-center rounded-2xl bg-white shadow-md">
                        <span className="text-2xl font-bold text-white">
                            <img src={logo} alt="Logo" />
                        </span>
                    </div>

                    <h1 className="text-3xl font-bold italic text-zinc-700">
                        Treino System
                    </h1>

                    <p className="mt-2 text-sm font-medium text-zinc-500">
                        Gestão profissional de alunos e treinos
                    </p>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg md:p-8">

                    <div className="mb-7">
                        <h2 className="text-2xl font-bold text-zinc-700">
                            Criar conta
                        </h2>

                        <p className="mt-1 text-sm text-zinc-500">
                            Cadastre-se para começar a gerenciar seus alunos.
                        </p>
                    </div>

                    <form onSubmit={handleRegister}>

                        <div className="mb-5">
                            <label
                                htmlFor="nome"
                                className="mb-2 block text-sm font-bold text-zinc-600"
                            >
                                Nome completo
                            </label>

                            <input
                                id="nome"
                                type="text"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                placeholder="Digite seu nome"
                                autoComplete="name"
                                className="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:border-[#a85f60] focus:bg-white"
                            />
                        </div>

                        <div className="mb-5">
                            <label
                                htmlFor="email"
                                className="mb-2 block text-sm font-bold text-zinc-600"
                            >
                                Email
                            </label>

                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                autoComplete="email"
                                className="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:border-[#a85f60] focus:bg-white"
                            />
                        </div>

                        <div className="mb-5">
                            <label
                                htmlFor="telefone"
                                className="mb-2 block text-sm font-bold text-zinc-600"
                            >
                                Telefone
                            </label>

                            <input
                                id="telefone"
                                type="tel"
                                value={telefone}
                                onChange={(e) => setTelefone(e.target.value)}
                                placeholder="(16) 99999-9999"
                                autoComplete="tel"
                                className="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:border-[#a85f60] focus:bg-white"
                            />
                        </div>

                        <div className="mb-5">
                            <label
                                htmlFor="senha"
                                className="mb-2 block text-sm font-bold text-zinc-600"
                            >
                                Senha
                            </label>

                            <div className="relative">
                                <input
                                    id="senha"
                                    type={mostrarSenha ? 'text' : 'password'}
                                    value={senha}
                                    onChange={(e) => setSenha(e.target.value)}
                                    placeholder="Mínimo de 6 caracteres"
                                    autoComplete="new-password"
                                    className="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-4 py-3 pr-20 text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:border-[#a85f60] focus:bg-white"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setMostrarSenha(!mostrarSenha)
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#a85f60] hover:text-[#914f50]"
                                >
                                    {mostrarSenha ? 'OCULTAR' : 'MOSTRAR'}
                                </button>
                            </div>
                        </div>

                        <div className="mb-7">
                            <label
                                htmlFor="confirmarSenha"
                                className="mb-2 block text-sm font-bold text-zinc-600"
                            >
                                Confirmar senha
                            </label>

                            <input
                                id="confirmarSenha"
                                type={mostrarSenha ? 'text' : 'password'}
                                value={confirmarSenha}
                                onChange={(e) =>
                                    setConfirmarSenha(e.target.value)
                                }
                                placeholder="Digite a senha novamente"
                                autoComplete="new-password"
                                className="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:border-[#a85f60] focus:bg-white"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={carregando}
                            className={`w-full rounded-xl px-5 py-4 font-bold uppercase tracking-wide transition ${carregando
                                ? 'cursor-not-allowed bg-zinc-300 text-zinc-500'
                                : 'bg-[#a85f60] text-white shadow-md hover:bg-[#914f50] hover:shadow-lg'
                                } `}
                        >
                            {carregando
                                ? 'Criando conta...'
                                : 'Criar conta'}
                        </button>
                    </form>

                    <div className="mt-7 border-t border-zinc-200 pt-6 text-center">
                        <p className="text-sm text-zinc-500">
                            Já possui uma conta?
                        </p>

                        <Link
                            to="/login"
                            className="mt-1 inline-block font-bold text-[#a85f60] hover:underline"
                        >
                            Fazer login
                        </Link>
                    </div>
                </div>

                <p className="mt-6 text-center text-xs text-zinc-400">
                    © 2026 Treino System
                </p>
            </div>
        </main>
    )
}
