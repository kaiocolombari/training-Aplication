import { useState } from 'react'
import navTool from '../components/navTool'
import Connection from '../service/api'

export default function Salvar() {
    const [login, setLogin] = useState('')
    const [senha, setSenha] = useState('')
    const [confirmar, setConfirmar] = useState(false)
    const [salvando, setSalvando] = useState(false)

    const apiOnline = Connection()

    const podeSalvar =
        apiOnline &&
        login.trim() !== '' &&
        senha.trim() !== '' &&
        confirmar

    const handleSalvar = async () => {
        if (!podeSalvar) return

        try {
            setSalvando(true)

            // Futuramente:
            // await fetch('/api/alunos', {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json'
            //     },
            //     body: JSON.stringify({
            //         login,
            //         senha
            //     })
            // })

            console.log('Salvando aluno...')
            console.log({
                login,
                senha
            })

            alert('Dados salvos com sucesso!')
        } catch (error) {
            console.error(error)
            alert('Erro ao salvar os dados.')
        } finally {
            setSalvando(false)
        }
    }

    return (
        <main className="min-h-full bg-[#ececec] p-3 md:p-5">
            {/* Cabeçalho */}
            <div>
                <hr className="mb-5 my-4 rounded-2xl border-[3px] border-zinc-400" />

                <header className="flex flex-col gap-2 border-b-2 border-[#b88b8b] pb-4">
                    <h1 className="text-3xl font-bold italic text-zinc-600">
                        Finalizar Avaliação
                    </h1>

                    <p className="text-sm font-bold uppercase tracking-wide text-zinc-500">
                        Confirme os dados antes de salvar
                    </p>
                </header>
            </div>

            {/* Conteúdo */}
            <section className="mx-auto mt-8 max-w-4xl">
                {/* Status da API */}
                <div
                    className={`mb-6 rounded-2xl border p-5 shadow-sm ${
                        apiOnline
                            ? 'border-green-200 bg-green-50'
                            : 'border-red-200 bg-red-50'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span
                                className={`h-4 w-4 rounded-full ${
                                    apiOnline
                                        ? 'bg-green-500'
                                        : 'bg-red-500'
                                }`}
                            />

                            <div>
                                <h2 className="font-bold text-zinc-700">
                                    Status do sistema
                                </h2>

                                <p className="text-sm text-zinc-500">
                                    {apiOnline
                                        ? 'A API está online e pronta para receber os dados.'
                                        : 'A API está offline. Não é possível salvar agora.'}
                                </p>
                            </div>
                        </div>

                        <span
                            className={`rounded-full px-4 py-2 text-xs font-bold uppercase ${
                                apiOnline
                                    ? 'bg-green-200 text-green-700'
                                    : 'bg-red-200 text-red-700'
                            }`}
                        >
                            {apiOnline ? 'Online' : 'Offline'}
                        </span>
                    </div>
                </div>

                {/* Card principal */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-md md:p-8">
                    {/* Título */}
                    <div className="mb-7">
                        <h2 className="text-2xl font-bold text-zinc-700">
                            Acesso do aluno
                        </h2>

                        <p className="mt-1 text-sm text-zinc-500">
                            Crie as credenciais que o aluno utilizará para
                            acessar o aplicativo mobile.
                        </p>
                    </div>

                    {/* Login */}
                    <div className="mb-5">
                        <label
                            htmlFor="login"
                            className="mb-2 block text-sm font-bold text-zinc-600"
                        >
                            Login do aluno
                        </label>

                        <input
                            id="login"
                            type="text"
                            value={login}
                            onChange={(e) => setLogin(e.target.value)}
                            placeholder="Digite o login do aluno"
                            className="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-700 outline-none transition focus:border-[#a85f60] focus:bg-white"
                        />

                        <p className="mt-1 text-xs text-zinc-400">
                            Esse será o usuário utilizado para entrar no
                            aplicativo mobile.
                        </p>
                    </div>

                    {/* Senha */}
                    <div className="mb-7">
                        <label
                            htmlFor="senha"
                            className="mb-2 block text-sm font-bold text-zinc-600"
                        >
                            Senha
                        </label>

                        <input
                            id="senha"
                            type="password"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            placeholder="Digite a senha do aluno"
                            className="w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-700 outline-none transition focus:border-[#a85f60] focus:bg-white"
                        />

                        <p className="mt-1 text-xs text-zinc-400">
                            A senha será utilizada para autenticação no
                            aplicativo mobile.
                        </p>
                    </div>

                    {/* Separador */}
                    <div className="my-6 border-t border-zinc-200" />

                    {/* Confirmação */}
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <label className="flex cursor-pointer items-start gap-3">
                            <input
                                type="checkbox"
                                checked={confirmar}
                                onChange={(e) =>
                                    setConfirmar(e.target.checked)
                                }
                                className="mt-1 h-5 w-5 accent-[#a85f60]"
                            />

                            <div>
                                <p className="font-bold text-zinc-700">
                                    Confirmar salvamento
                                </p>

                                <p className="mt-1 text-sm text-zinc-600">
                                    Sim, desejo salvar a avaliação e criar o
                                    acesso do aluno ao aplicativo mobile.
                                </p>
                            </div>
                        </label>
                    </div>

                    {/* Aviso API offline */}
                    {!apiOnline && (
                        <div className="mt-4 rounded-xl bg-red-100 p-4 text-sm font-semibold text-red-700">
                            Não é possível salvar enquanto a API estiver
                            offline.
                        </div>
                    )}

                    {/* Botão */}
                    <button
                        onClick={handleSalvar}
                        disabled={!podeSalvar || salvando}
                        className={`mt-7 w-full rounded-xl px-5 py-4 font-bold uppercase tracking-wide transition ${
                            podeSalvar && !salvando
                                ? 'bg-[#a85f60] text-white shadow-md hover:bg-[#914f50] hover:shadow-lg'
                                : 'cursor-not-allowed bg-zinc-200 text-zinc-400'
                        }`}
                    >
                        {salvando ? 'Salvando...' : 'Salvar avaliação'}
                    </button>
                </div>

                {/* Resumo */}
                <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-3 font-bold text-zinc-700">
                        O que acontecerá ao salvar?
                    </h3>

                    <ul className="space-y-2 text-sm text-zinc-500">
                        <li>✓ Os dados da avaliação serão enviados para a API.</li>
                        <li>✓ O aluno será cadastrado no sistema.</li>
                        <li>✓ O login e senha serão associados ao aluno.</li>
                        <li>✓ O aluno poderá utilizar essas credenciais no app mobile.</li>
                    </ul>
                </div>
            </section>

            <div className="mt-10">
                {navTool()}
            </div>
            <br></br>
        </main>
    )
}