import { useEffect, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CheckCircle2, Clock3, ExternalLink, LogOut, RefreshCw, ShieldAlert } from "lucide-react-native";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/services/api";

const webUrl = process.env.EXPO_PUBLIC_WEB_APP_URL?.trim();

export default function CadastroPendenteScreen() {
    const { user, refreshUser, logout } = useAuth();
    const [checking, setChecking] = useState(false);
    const [error, setError] = useState("");

    async function verificar() {
        setChecking(true);
        setError("");
        try { await refreshUser(); }
        catch (cause) { setError(cause instanceof ApiError ? cause.message : "Não foi possível consultar o status agora."); }
        finally { setChecking(false); }
    }

    useEffect(() => {
        const interval = setInterval(() => { void refreshUser().catch(() => undefined); }, 30_000);
        return () => clearInterval(interval);
    }, [refreshUser]);

    const reprovado = user?.statusCadastro === "REPROVADO";
    const precisaFormulario = !user?.formularioEnviado || reprovado;

    return (
        <SafeAreaView edges={["top", "bottom"]} className="flex-1 items-center justify-center bg-[#111312] px-6">
            <View className="w-full max-w-md items-center">
                <View className="h-20 w-20 items-center justify-center rounded-[28px] border border-[#C47C7D]/30 bg-[#A85F60]/15">{reprovado ? <ShieldAlert color="#E0A4A5" size={32}/> : <Clock3 color="#E0A4A5" size={32}/>}</View>
                <Text className="mt-8 text-[10px] font-extrabold uppercase tracking-[2.2px] text-[#D18B8C]">Acesso em análise</Text>
                <Text className="mt-3 text-center text-[28px] font-black leading-[34px] tracking-[-1px] text-white">{reprovado ? "Precisamos de alguns ajustes." : "Estamos avaliando seu perfil."}</Text>
                <Text className="mt-4 text-center text-[12px] leading-6 text-white/60">{reprovado ? user?.observacaoAnalise || "A equipe solicitou ajustes no formulário do seu cadastro." : `Olá, ${user?.nome?.split(" ")[0] ?? "aluno"}. ${user?.formularioEnviado ? "Seu formulário foi recebido e está aguardando análise da equipe." : "Para concluir seu cadastro, acesse o site e responda ao formulário inicial."}`}</Text>

                <View className="mt-8 w-full rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                    <View className="flex-row items-center gap-3"><CheckCircle2 color="#C8EF73" size={17}/><Text className="text-[11px] font-bold text-white">Conta criada por convite</Text></View>
                    <View className="ml-2 mt-2 h-6 w-px bg-white/15"/>
                    <View className="flex-row items-center gap-3">{user?.formularioEnviado ? <CheckCircle2 color="#C8EF73" size={17}/> : <Clock3 color="#D18B8C" size={17}/>}<Text className="text-[11px] font-bold text-white">{user?.formularioEnviado ? "Formulário enviado" : "Formulário pendente no site"}</Text></View>
                    <View className="ml-2 mt-2 h-6 w-px bg-white/15"/>
                    <View className="flex-row items-center gap-3"><Clock3 color="#D18B8C" size={17}/><Text className="text-[11px] font-bold text-[#E0A4A5]">{reprovado ? "Aguardando correção" : "Aguardando aprovação"}</Text></View>
                </View>

                {precisaFormulario && webUrl ? <Pressable onPress={() => void Linking.openURL(`${webUrl.replace(/\/$/, "")}/cadastro/formulario`).catch(() => setError("Não foi possível abrir o site."))} className="mt-6 h-12 w-full flex-row items-center justify-center gap-2 rounded-xl bg-[#C8EF73]"><ExternalLink color="#17211B" size={15}/><Text className="text-[11px] font-extrabold text-[#17211B]">Abrir formulário no site</Text></Pressable> : null}
                <Pressable onPress={() => void verificar()} disabled={checking} className="mt-3 h-12 w-full flex-row items-center justify-center gap-2 rounded-xl border border-white/15"><RefreshCw color="#FFFFFF" size={15}/><Text className="text-[11px] font-extrabold text-white">{checking ? "Consultando..." : "Verificar aprovação"}</Text></Pressable>
                {error ? <Text className="mt-4 text-center text-[11px] text-red-300">{error}</Text> : null}
                {!webUrl && precisaFormulario ? <Text className="mt-3 text-center text-[10px] leading-5 text-white/35">Configure EXPO_PUBLIC_WEB_APP_URL para abrir o formulário pelo aplicativo. Você também pode entrar pelo site no navegador.</Text> : null}
                <Pressable onPress={() => { void logout().catch(() => undefined).then(() => router.replace("/login")); }} className="mt-5 flex-row items-center gap-2 py-2"><LogOut color="#FFFFFF" size={14}/><Text className="text-[10px] font-semibold text-white/55">Sair da conta</Text></Pressable>
            </View>
        </SafeAreaView>
    );
}
