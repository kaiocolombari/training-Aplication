import { router } from "expo-router";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { ArrowLeft, Bell, CheckCheck, RefreshCw } from "lucide-react-native";

import { AppScreen, Eyebrow, IconButton, SectionTitle, Tag } from "@/components/ui";
import { useStudentData } from "@/context/StudentDataContext";

export default function NotificationsScreen() {
  const { data, isLoading, isRefreshing, error, unreadNotifications, refresh, markNotificationRead, markAllNotificationsRead } = useStudentData();

  async function readNotification(id: string) {
    try {
      await markNotificationRead(id);
    } catch (cause) {
      Alert.alert("Não foi possível atualizar", cause instanceof Error ? cause.message : "Tente novamente.");
    }
  }

  return (
    <AppScreen>
      <View className="flex-row items-center justify-between pt-3">
        <IconButton onPress={() => router.back()}><ArrowLeft color="#17211B" size={19} /></IconButton>
        <Eyebrow>AVISOS DA SUA CONTA</Eyebrow>
        <IconButton onPress={() => void refresh().catch(() => undefined)}><RefreshCw color="#17211B" size={16} /></IconButton>
      </View>
      <View className="mt-6 flex-row items-end justify-between">
        <View><Text className="text-[29px] font-black tracking-[-1px] text-ink">Notificações</Text><Text className="mt-1 text-[11px] text-muted">Atualizações do seu acompanhamento.</Text></View>
        {unreadNotifications > 0 ? <Tag tone="lime">{unreadNotifications} NÃO LIDAS</Tag> : <Tag>EM DIA</Tag>}
      </View>

      {unreadNotifications > 0 ? <Pressable onPress={() => void markAllNotificationsRead().catch((cause) => Alert.alert("Erro", cause instanceof Error ? cause.message : "Tente novamente."))} className="mt-5 self-start flex-row items-center gap-2 rounded-xl bg-ink px-3 py-2.5"><CheckCheck color="#C8EF73" size={14} /><Text className="text-[10px] font-bold text-white">Marcar todas como lidas</Text></Pressable> : null}

      {isLoading ? <View className="mt-8 items-center"><ActivityIndicator color="#526447" /><Text className="mt-3 text-[10px] text-muted">Carregando notificações...</Text></View> : null}
      {error ? <Pressable onPress={() => void refresh().catch(() => undefined)} className="mt-5 rounded-2xl border border-[#E8D8CE] bg-[#FBF1EA] p-4"><Text className="text-[10px] text-[#8D4F3E]">{error} · Toque para tentar novamente.</Text></Pressable> : null}
      {!isLoading && data.notifications.length === 0 ? <View className="mt-6 items-center rounded-[24px] border border-dashed border-line bg-white p-7"><Bell color="#899183" size={23} /><Text className="mt-3 text-[12px] font-extrabold text-ink">Tudo tranquilo por aqui</Text><Text className="mt-1 text-center text-[10px] leading-4 text-muted">Quando houver uma atualização do seu personal, ela aparecerá nesta tela.</Text></View> : null}

      <SectionTitle>Recentes</SectionTitle>
      {data.notifications.map((notification) => (
        <Pressable key={notification.id} onPress={() => !notification.lidaEm ? void readNotification(notification.id) : undefined} className={`mb-3 rounded-[22px] border p-4 ${notification.lidaEm ? "border-line bg-white" : "border-[#DCE4D1] bg-[#F7F9F2]"}`}>
          <View className="flex-row items-center justify-between"><View className="flex-row items-center gap-2"><View className={`h-2 w-2 rounded-full ${notification.lidaEm ? "bg-[#C9CCC4]" : "bg-[#8BA66A]"}`} /><Text className="text-[9px] font-extrabold uppercase tracking-[1px] text-[#7B8375]">{notification.tipo}</Text></View><Text className="text-[9px] text-muted">{new Date(notification.criadaEm).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</Text></View>
          <Text className="mt-3 text-[13px] font-extrabold text-ink">{notification.titulo}</Text>
          <Text className="mt-1 text-[11px] leading-5 text-[#6F776C]">{notification.mensagem}</Text>
          {!notification.lidaEm ? <Text className="mt-3 text-[9px] font-bold text-[#647B4D]">Toque para marcar como lida</Text> : null}
        </Pressable>
      ))}
      {isRefreshing ? <View className="mb-4 flex-row items-center justify-center gap-2"><ActivityIndicator size="small" color="#526447" /><Text className="text-[9px] text-muted">Atualizando...</Text></View> : null}
    </AppScreen>
  );
}
