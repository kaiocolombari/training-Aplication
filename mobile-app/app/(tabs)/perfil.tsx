import { Alert, Pressable, Text, View } from "react-native";
import { Bell, ChevronRight, CircleHelp, ClipboardList, LogOut, MessageCircle, ShieldCheck, UserRound } from "lucide-react-native";

import { AppScreen, Eyebrow, SectionTitle } from "@/components/ui";

const options = [
  { label: "Minhas avaliações", description: "Medidas e histórico corporal", icon: ClipboardList },
  { label: "Falar com meu personal", description: "Dúvidas sobre seu planejamento", icon: MessageCircle },
  { label: "Lembretes de treino", description: "Dias e horários das notificações", icon: Bell },
  { label: "Privacidade e segurança", description: "Seus dados e dispositivos", icon: ShieldCheck },
  { label: "Ajuda e suporte", description: "Perguntas frequentes", icon: CircleHelp },
];

export default function ProfileScreen() {
  return (
    <AppScreen>
      <View className="pt-4"><Eyebrow>SUA CONTA</Eyebrow><Text className="mt-2 text-[30px] font-black tracking-[-1px] text-ink">Perfil</Text></View>
      <View className="mt-6 flex-row items-center gap-4 rounded-[24px] border border-line bg-white p-5">
        <View className="h-[58px] w-[58px] items-center justify-center rounded-[20px] bg-ink"><Text className="text-[19px] font-black text-lime">RM</Text></View>
        <View className="flex-1"><Text className="text-[17px] font-extrabold text-ink">Rafael Martins</Text><Text className="mt-1 text-[10px] text-muted">Aluno desde março de 2026</Text><View className="mt-2 self-start rounded-full bg-[#EDF2E5] px-2.5 py-1"><Text className="text-[9px] font-bold text-[#647B4D]">PLANO ATIVO</Text></View></View>
        <Pressable onPress={() => Alert.alert("Editar perfil", "A edição de dados será conectada à sua conta na próxima etapa.")} className="h-9 w-9 items-center justify-center rounded-full bg-[#F3F1EB]"><UserRound color="#596257" size={16} /></Pressable>
      </View>

      <SectionTitle>Profissional responsável</SectionTitle>
      <View className="flex-row items-center gap-3 rounded-[22px] bg-ink p-4">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-white/10"><Text className="text-[12px] font-extrabold text-lime">CH</Text></View>
        <View className="flex-1"><Text className="text-[12px] font-bold text-white">Carlos Henrique</Text><Text className="mt-1 text-[10px] text-white/55">Personal trainer · CREF 000000-G/SP</Text></View>
        <View className="rounded-full bg-lime/15 px-2.5 py-1"><Text className="text-[9px] font-bold text-lime">VINCULADO</Text></View>
      </View>

      <SectionTitle>Configurações</SectionTitle>
      <View className="rounded-[24px] border border-line bg-white px-4">
        {options.map((item, index) => {
          const Icon = item.icon;
          return <Pressable key={item.label} onPress={() => Alert.alert(item.label, "Esta área será integrada aos dados da sua conta.")} className={`flex-row items-center gap-3 py-4 active:opacity-70 ${index < options.length - 1 ? "border-b border-[#F0EEE8]" : ""}`}><View className="h-9 w-9 items-center justify-center rounded-xl bg-[#F2F0EA]"><Icon color="#687263" size={17} /></View><View className="flex-1"><Text className="text-[11px] font-bold text-ink">{item.label}</Text><Text className="mt-1 text-[9px] text-muted">{item.description}</Text></View><ChevronRight color="#A3A69F" size={17} /></Pressable>;
        })}
      </View>

      <Pressable onPress={() => Alert.alert("Sair da conta", "A autenticação será conectada à API na próxima etapa.")} className="mt-5 h-12 flex-row items-center justify-center gap-2 rounded-2xl border border-[#E5D8D3] bg-[#F7EFEB]"><LogOut color="#A45F4D" size={15} /><Text className="text-[11px] font-extrabold text-[#A45F4D]">Sair da conta</Text></Pressable>
      <Text className="mb-6 mt-5 text-center text-[9px] font-semibold tracking-[1.5px] text-[#A3A69F]">TREINO SYSTEM · VERSÃO CONCEITO 0.1</Text>
    </AppScreen>
  );
}
