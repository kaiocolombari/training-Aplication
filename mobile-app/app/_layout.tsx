import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
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
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F3F1EB" } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="treino/[id]" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="execucao" options={{ animation: "slide_from_bottom", gestureEnabled: false }} />
      </Stack>
    </WorkoutProvider>
  );
}
