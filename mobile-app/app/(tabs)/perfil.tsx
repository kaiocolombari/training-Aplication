import { Alert, Linking, Text, View } from "react-native";
import { Bell, ChevronRight, CircleHelp, ClipboardList, LogOut, MessageCircle, MessageSquareText, PhoneCall, ShieldCheck, UserRound } from "lucide-react-native";
import { router, type Href } from "expo-router";

import { AppScreen, EnteringView, Eyebrow, MotionPressable, SectionTitle } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useStudentData } from "@/context/StudentDataContext";
import { TeamSkeleton } from "@/components/Skeletons";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { data, isLoading, unreadNotifications } = useStudentData();
  const initials = (user?.nome ?? "Aluno").split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  const choosePersonal = () => router.push("/conversas" as Href);

  const options = [
    { label: "Minhas avaliações", description: "Medidas e histórico corporal", icon: ClipboardList, action: () => router.push("/(tabs)/evolucao") },
    { label: "Falar com a equipe", description: "Converse com um profissional do time", icon: MessageCircle, action: choosePersonal },
    { label: "Enviar feedback", description: `${data.feedbacks.length} enviados · acompanhe respostas`, icon: MessageSquareText, action: () => router.push("/feedback" as Href) },
    { label: "Notificações", description: `${unreadNotifications} não lidas`, icon: Bell, action: () => router.push("/notificacoes") },
    { label: "Privacidade e segurança", description: "Sessão protegida e dados da conta", icon: ShieldCheck, action: () => Alert.alert("Privacidade e segurança", `Conta autenticada como ${user?.email ?? "usuário"}. Para encerrar o acesso neste aparelho, use Sair da conta.`) },
    { label: "Ajuda e suporte", description: "Converse com um profissional da equipe", icon: CircleHelp, action: choosePersonal },
  ];

  return (
    <AppScreen>
      <View className="pt-4"><Eyebrow>SUA CONTA</Eyebrow><Text className="mt-2 text-[30px] font-black tracking-[-1px] text-ink">Perfil</Text></View>
      <View className="mt-6 flex-row items-center gap-4 rounded-[24px] border border-line bg-white p-5">
        <View className="h-[58px] w-[58px] items-center justify-center rounded-[20px] bg-ink"><Text className="text-[19px] font-black text-lime">{initials}</Text></View>
        <View className="flex-1"><Text className="text-[17px] font-extrabold text-ink">{user?.nome ?? "Aluno"}</Text><Text className="mt-1 text-[10px] text-muted">{user?.email}</Text><View className="mt-2 self-start rounded-full bg-[#EDF2E5] px-2.5 py-1"><Text className="text-[9px] font-bold text-[#647B4D]">{user?.statusCadastro === "APROVADO" ? "CADASTRO APROVADO" : "CADASTRO PENDENTE"}</Text></View></View>
        <View className="h-9 w-9 items-center justify-center rounded-full bg-[#F3F1EB]"><UserRound color="#596257" size={16} /></View>
      </View>

      <SectionTitle>Profissionais da equipe</SectionTitle>
      {isLoading && data.personals.length === 0 ? <TeamSkeleton /> : data.personals.length > 0 ? data.personals.map((personal, index) => (
        <EnteringView key={personal.outroUsuarioId} delay={index * 45}>
        <MotionPressable onPress={() => router.push({ pathname: "/mensagens", params: { destinatarioId: personal.outroUsuarioId, nome: personal.outroUsuarioNome, conversaId: personal.conversaId ?? "" } })} className="mb-2 flex-row items-center gap-3 rounded-[22px] bg-ink p-4">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-white/10"><Text className="text-[12px] font-extrabold text-lime">{personal.outroUsuarioNome.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</Text></View>
          <View className="flex-1"><Text className="text-[12px] font-bold text-white">{personal.outroUsuarioNome}</Text><Text className="mt-1 text-[10px] text-white/55">Profissional disponível para conversar</Text>{personal.ultimaMensagem ? <Text numberOfLines={1} className="mt-1 text-[9px] text-white/45">{personal.ultimaMensagem}</Text> : null}</View>
          {personal.naoLidas > 0 ? <View className="h-5 min-w-5 items-center justify-center rounded-full bg-lime px-1"><Text className="text-[9px] font-black text-ink">{personal.naoLidas}</Text></View> : null}
          <MessageCircle color="#C8EF73" size={18} />
        </MotionPressable>
        </EnteringView>
      )) : (
        <View className="rounded-[22px] bg-ink p-4"><Text className="text-[12px] font-bold text-white">Nenhum profissional disponível</Text><Text className="mt-1 text-[10px] leading-4 text-white/55">Os profissionais ativos da equipe aparecerão aqui.</Text></View>
      )}

      <SectionTitle>Informações do convite</SectionTitle>
      <View className="rounded-[22px] border border-line bg-white p-4">
        {user?.convidadoPorPersonalNome ? (
          <>
            <View className="flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#EDF2E5]"><UserRound color="#526447" size={19} /></View>
              <View className="min-w-0 flex-1"><Text className="text-[9px] font-bold uppercase tracking-[1px] text-muted">Você foi convidado por</Text><Text className="mt-1 text-[13px] font-extrabold text-ink">{user.convidadoPorPersonalNome}</Text></View>
            </View>
            <View className="mt-4 rounded-xl bg-[#F6F5F0] p-3">
              <Text className="text-[9px] font-bold uppercase tracking-[1px] text-muted">Telefone para contato</Text>
              <Text className="mt-1 text-[12px] font-bold text-ink">{user.convidadoPorPersonalTelefone?.trim() || "Telefone não informado"}</Text>
            </View>
            {user.convidadoPorPersonalTelefone?.trim() ? <MotionPressable onPress={() => { const phone = user.convidadoPorPersonalTelefone?.replace(/[^\d+]/g, ""); if (phone) void Linking.openURL(`tel:${phone}`).catch(() => Alert.alert("Não foi possível abrir o telefone", "Verifique se o aparelho possui um aplicativo de chamadas configurado.")); }} className="mt-3 h-11 flex-row items-center justify-center gap-2 rounded-xl bg-ink"><PhoneCall color="#C8EF73" size={15} /><Text className="text-[10px] font-extrabold text-white">Ligar para {user.convidadoPorPersonalNome.split(" ")[0]}</Text></MotionPressable> : null}
            <Text className="mt-3 text-[9px] leading-4 text-muted">Este é o profissional que enviou seu convite de entrada. Toda a equipe continua disponível para acompanhar seus treinos.</Text>
          </>
        ) : (
          <Text className="text-[10px] leading-5 text-muted">A origem do convite não está disponível para esta conta. Você ainda pode conversar com qualquer profissional ativo da equipe.</Text>
        )}
      </View>

      <SectionTitle>Configurações</SectionTitle>
      <View className="rounded-[24px] border border-line bg-white px-4">
        {options.map((item, index) => {
          const Icon = item.icon;
          return <EnteringView key={item.label} delay={index * 30}><MotionPressable onPress={item.action} className={`flex-row items-center gap-3 py-4 active:opacity-70 ${index < options.length - 1 ? "border-b border-[#F0EEE8]" : ""}`}><View className="h-9 w-9 items-center justify-center rounded-xl bg-[#F2F0EA]"><Icon color="#687263" size={17} /></View><View className="flex-1"><Text className="text-[11px] font-bold text-ink">{item.label}</Text><Text className="mt-1 text-[9px] text-muted">{item.description}</Text></View><ChevronRight color="#A3A69F" size={17} /></MotionPressable></EnteringView>;
        })}
      </View>

      <MotionPressable onPress={() => { void logout().catch((cause) => Alert.alert("Não foi possível sair", cause instanceof Error ? cause.message : "Tente novamente.")).then(() => router.replace("/login")); }} className="mt-5 h-12 flex-row items-center justify-center gap-2 rounded-2xl border border-[#E5D8D3] bg-[#F7EFEB]"><LogOut color="#A45F4D" size={15} /><Text className="text-[11px] font-extrabold text-[#A45F4D]">Sair da conta</Text></MotionPressable>
      <Text className="mb-6 mt-5 text-center text-[9px] font-semibold tracking-[1.5px] text-[#A3A69F]">TREINO SYSTEM · DADOS DA CONTA</Text>
    </AppScreen>
  );
}
