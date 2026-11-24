import { router, Stack, usePathname, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { useWorkout, WorkoutProvider } from "@/context/WorkoutContext";
import { StudentDataProvider } from "@/context/StudentDataContext";
import { configureNotificationPresentation } from "@/services/notifications";
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
        <StatusBar style="dark" />
        <AppNavigator />
        </StudentDataProvider>
      </WorkoutProvider>
    </AuthProvider>
  );
}

function AppNavigator() {
  const { user, isLoading } = useAuth();
  const { syncPendingSubmissions } = useWorkout();
  const pathname = usePathname();
  const segments = useSegments();
  const firstSegment = segments[0] as string | undefined;

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

    const isStudentArea = firstSegment === "(tabs)" || firstSegment === "treino" || firstSegment === "execucao" || firstSegment === "mensagens" || firstSegment === "notificacoes" || firstSegment === "feedback";
    if (!isStudentArea) {
      router.replace("/(tabs)");
    }
  }, [user, isLoading, pathname, firstSegment]);

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
      <Stack.Screen name="notificacoes" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="feedback" options={{ animation: "slide_from_right" }} />
    </Stack>
  );
}
