import { router, Stack, usePathname, useSegments } from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { useWorkout, WorkoutProvider } from "@/context/WorkoutContext";
import { StudentDataProvider, useStudentData } from "@/context/StudentDataContext";
import { ChatRealtimeProvider } from "@/context/ChatRealtimeContext";
import { configureNotificationPresentation, registerChatPushToken } from "@/services/notifications";
import "../global.css";

configureNotificationPresentation();

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  return (
    <AuthProvider>
      <WorkoutProvider>
        <StudentDataProvider>
          <ChatRealtimeProvider>
            <StatusBar style="dark" />
            <AppNavigator />
          </ChatRealtimeProvider>
        </StudentDataProvider>
      </WorkoutProvider>
    </AuthProvider>
  );
}

function AppNavigator() {
  const { user, isLoading } = useAuth();
  const { data } = useStudentData();
  const { syncPendingSubmissions } = useWorkout();
  const pathname = usePathname();
  const segments = useSegments();
  const firstSegment = segments[0] as string | undefined;
  const pendingChat = useRef<{ conversaId: string; remetenteId?: string } | null>(null);
  const lastNotificationId = useRef<string | null>(null);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      if (pathname !== "/login" && pathname !== "/register") router.replace("/login");
      return;
    }

    if (user.tipo !== "ALUNO") {
      router.replace("/login");
      return;
    }

    if (user.statusCadastro !== "APROVADO") {
      const destination = user.formularioEnviado ? "/cadastro/aguardando" : "/cadastro/formulario";
      if (pathname !== destination) router.replace(destination);
      return;
    }

    const isStudentArea = firstSegment === "(tabs)" || firstSegment === "treino" || firstSegment === "execucao" || firstSegment === "mensagens" || firstSegment === "conversas" || firstSegment === "notificacoes" || firstSegment === "feedback";
    if (!isStudentArea) {
      router.replace("/(tabs)");
    }
  }, [user, isLoading, pathname, firstSegment]);

  useEffect(() => {
    if (user?.tipo === "ALUNO" && user.statusCadastro === "APROVADO") {
      void registerChatPushToken().catch(() => undefined);
    }
  }, [user?.usuarioId, user?.tipo, user?.statusCadastro]);

  useEffect(() => {
    const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
      const notificationId = response.notification.request.identifier;
      if (lastNotificationId.current === notificationId) return;
      lastNotificationId.current = notificationId;
      const payload = response.notification.request.content.data as { type?: string; conversaId?: string; remetenteId?: string };
      if (payload.type === "CHAT" && payload.conversaId) pendingChat.current = { conversaId: payload.conversaId, remetenteId: payload.remetenteId };
      const personal = data.personals.find((item) => item.outroUsuarioId === pendingChat.current?.remetenteId || item.conversaId === pendingChat.current?.conversaId);
      if (personal && pendingChat.current) {
        router.push({ pathname: "/mensagens", params: {
          destinatarioId: personal.outroUsuarioId,
          nome: personal.outroUsuarioNome,
          conversaId: pendingChat.current.conversaId,
        } });
        pendingChat.current = null;
      }
    };
    const subscription = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
    void Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) handleNotificationResponse(response);
    });
    return () => subscription.remove();
  }, [data.personals]);

  useEffect(() => {
    if (!pendingChat.current) return;
    const personal = data.personals.find((item) => item.outroUsuarioId === pendingChat.current?.remetenteId || item.conversaId === pendingChat.current?.conversaId);
    if (!personal) return;
    router.push({ pathname: "/mensagens", params: {
      destinatarioId: personal.outroUsuarioId,
      nome: personal.outroUsuarioNome,
      conversaId: pendingChat.current.conversaId,
    } });
    pendingChat.current = null;
  }, [data.personals]);

  useEffect(() => {
    if (!isLoading && user?.tipo === "ALUNO" && user.statusCadastro === "APROVADO") {
      void syncPendingSubmissions().catch(() => undefined);
    }
  }, [user?.alunoId, user?.statusCadastro, user?.tipo, isLoading, pathname, syncPendingSubmissions]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F3F1EB]">
        <ActivityIndicator color="#526447" size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F3F1EB" } }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="cadastro/formulario" options={{ gestureEnabled: false }} />
      <Stack.Screen name="cadastro/aguardando" options={{ gestureEnabled: false }} />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="treino/[id]" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="execucao" options={{ animation: "slide_from_bottom", gestureEnabled: false }} />
      <Stack.Screen name="mensagens" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="conversas" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="notificacoes" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="feedback" options={{ animation: "slide_from_right" }} />
    </Stack>
  );
}
