import { router } from "expo-router";
import { ArrowLeft, ChevronRight, MessageCircle, UserRound } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { AppScreen, Eyebrow } from "@/components/ui";
import { useStudentData } from "@/context/StudentDataContext";

export default function ConversationsScreen() {
  const { data } = useStudentData();

  return (
    <AppScreen>
      <View className="flex-row items-center gap-3 pt-4">
        <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-white"><ArrowLeft color="#17211B" size={18} /></Pressable>
        <View className="flex-1"><Eyebrow>COMUNICAÇÃO</Eyebrow><Text className="mt-1 text-[25px] font-black tracking-[-1px] text-ink">Conversar com</Text></View>
      </View>
      <Text className="mb-5 mt-2 text-[11px] leading-5 text-muted">Escolha o profissional específico. Cada conversa é privada e será encerrada após 48 horas sem novas mensagens.</Text>

      {data.personals.length ? data.personals.map((personal) => (
        <Pressable
          key={personal.outroUsuarioId}
          onPress={() => router.push({ pathname: "/mensagens", params: {
            destinatarioId: personal.outroUsuarioId,
            nome: personal.outroUsuarioNome,
            conversaId: personal.conversaId ?? "",
          } })}
          className="mb-3 flex-row items-center gap-3 rounded-[22px] border border-line bg-white p-4 active:opacity-70"
        >
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#E8EDDE]"><UserRound color="#526447" size={20} /></View>
          <View className="flex-1"><Text className="text-[12px] font-extrabold text-ink">{personal.outroUsuarioNome}</Text><Text numberOfLines={1} className="mt-1 text-[9px] text-muted">{personal.ultimaMensagem ?? "Inicie uma conversa com este profissional"}</Text></View>
          {personal.naoLidas > 0 ? <View className="h-6 min-w-6 items-center justify-center rounded-full bg-lime px-1.5"><Text className="text-[9px] font-black text-ink">{personal.naoLidas}</Text></View> : null}
          <ChevronRight color="#A3A69F" size={18} />
        </Pressable>
      )) : (
        <View className="items-center rounded-[24px] bg-ink p-7"><MessageCircle color="#C8EF73" size={24} /><Text className="mt-3 text-[13px] font-extrabold text-white">Nenhum personal vinculado</Text><Text className="mt-2 text-center text-[10px] leading-5 text-white/60">Quando um profissional for vinculado à sua conta, você poderá iniciar uma conversa privada.</Text></View>
      )}
    </AppScreen>
  );
}
