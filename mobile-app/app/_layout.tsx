import { router, Stack, usePathname, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { WorkoutProvider } from "@/context/WorkoutContext";
import { configureNotificationPresentation } from "@/services/notifications";
import "../global.css";

configureNotificationPresentation();

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  return (
    <WorkoutProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <AppNavigator />
      </AuthProvider>
    </WorkoutProvider>
  );
}

function AppNavigator() {
  const { user, isLoading } = useAuth();
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

    const isStudentArea = firstSegment === "(tabs)" || firstSegment === "treino" || firstSegment === "execucao";
    if (!isStudentArea) {
      router.replace("/(tabs)");
    }
  }, [user, isLoading, pathname, firstSegment]);

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
    </Stack>
  );
}
