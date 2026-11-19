import { useEffect, useState } from "react";
import { router } from "expo-router";
import { Check, Clock3, LogOut, RefreshCw } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/services/api";

export default function RegistrationWaitingScreen() {
  const { user, refreshUser, logout } = useAuth();
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  async function checkStatus() {
    setChecking(true);
    setError("");
    try {
      await refreshUser();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Não foi possível consultar o cadastro agora.");
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      void refreshUser().catch(() => undefined);
    }, 30_000);
    return () => clearInterval(interval);
  }, [refreshUser]);

  useEffect(() => {
    if (user?.statusCadastro === "APROVADO") router.replace("/(tabs)");
    if (user && !user.formularioEnviado) router.replace("/cadastro/formulario");
  }, [user]);

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 items-center justify-center bg-[#111312] px-6">
      <View className="w-full max-w-md items-center">
        <View className="h-20 w-20 items-center justify-center rounded-[28px] border border-[#C47C7D]/30 bg-[#A85F60]/15"><Clock3 color="#E0A4A5" size={32} /></View>
        <Text className="mt-8 text-[10px] font-extrabold uppercase tracking-[2.2px] text-[#D18B8C]">Cadastro recebido</Text>
        <Text className="mt-3 text-center text-[29px] font-black leading-[35px] tracking-[-1px] text-white">Estamos avaliando seu perfil.</Text>
        <Text className="mt-4 text-center text-[12px] leading-6 text-white/60">Tudo certo, {user?.nome?.split(" ")[0] ?? "aluno"}. Suas respostas foram enviadas. Nossa equipe vai analisar seu cadastro e, assim que ele for aprovado, seu acesso aos treinos será liberado.</Text>

        <View className="mt-8 w-full rounded-2xl border border-white/10 bg-white/[0.045] p-4">
          <View className="flex-row items-center gap-3"><Check color="#C8EF73" size={17} /><Text className="text-[11px] font-bold text-white">Conta criada</Text></View>
          <View className="ml-2 mt-2 h-6 w-px bg-white/15" />
          <View className="flex-row items-center gap-3"><Check color="#C8EF73" size={17} /><Text className="text-[11px] font-bold text-white">Questionário enviado</Text></View>
          <View className="ml-2 mt-2 h-6 w-px bg-white/15" />
          <View className="flex-row items-center gap-3"><View className="h-4 w-4 rounded-full border border-[#D18B8C]" /><Text className="text-[11px] font-bold text-[#E0A4A5]">Aguardando aprovação da equipe</Text></View>
        </View>

        {error ? <Text className="mt-4 text-center text-[11px] text-red-300">{error}</Text> : null}
        <Pressable onPress={checkStatus} disabled={checking} className={`mt-7 h-12 w-full flex-row items-center justify-center gap-2 rounded-xl bg-[#A85F60] ${checking ? "opacity-50" : ""}`}>
          <RefreshCw color="#FFFFFF" size={15} /><Text className="text-[11px] font-extrabold text-white">{checking ? "Consultando..." : "Verificar aprovação"}</Text>
        </Pressable>
        <Pressable onPress={() => { void logout().catch(() => undefined).then(() => router.replace("/login")); }} className="mt-5 flex-row items-center gap-2 py-2">
          <LogOut color="#FFFFFF" size={14} /><Text className="text-[10px] font-semibold text-white/55">Sair da conta</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
