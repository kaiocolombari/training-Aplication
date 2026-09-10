import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import logo from "../assets/logo.png"

export default function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando, setCarregando] = useState(false)

  const handleLogin = async (e: any) => {
    e.preventDefault()

    if (!email || !senha) {
      alert('Preencha o email e a senha.')
      return
    }

    try {
      setCarregando(true)

      // Futuramente:
      //
      // const response = await fetch('http://localhost:xxxx/api/auth/login', {
      //     method: 'POST',
      //     headers: {
      //         'Content-Type': 'application/json'
      //     },
      //     body: JSON.stringify({
      //         email,
      //         senha
      //     })
      // })
      //
      // const data = await response.json()
      //
      // localStorage.setItem('token', data.token)

      console.log({
        email,
        senha
      })

      // navigate('/dashboard')

    } catch (error) {
      console.error(error)
      alert('Erro ao realizar login.')
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
              Acesso do Personal
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Entre com suas credenciais para acessar o sistema.
            </p>
          </div>

          <form onSubmit={handleLogin}>

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

            <div className="mb-3">
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
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
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

            <div className="mb-7 text-right">
              <button
                type="button"
                className="text-sm font-semibold text-[#a85f60] hover:underline"
              >
                Esqueci minha senha
              </button>
            </div>

            <button
              type="submit"
              disabled={carregando}
              className={`w-full rounded-xl px-5 py-4 font-bold uppercase tracking-wide transition ${carregando
                ? 'cursor-not-allowed bg-zinc-300 text-zinc-500'
                : 'bg-[#a85f60] text-white shadow-md hover:bg-[#914f50] hover:shadow-lg'
                }`}
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-7 border-t border-zinc-200 pt-6 text-center">
            <p className="text-sm text-zinc-500">
              Ainda não possui uma conta?
            </p>

            <Link
              to="/register"
              className="mt-1 inline-block font-bold text-[#a85f60] hover:underline"
            >
              Criar conta de Personal
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