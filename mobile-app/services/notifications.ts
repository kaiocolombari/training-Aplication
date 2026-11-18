import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const WORKOUT_CHANNEL_ID = "treino-progresso";

export type AppNotification = {
  title: string;
  body: string;
  data?: Record<string, string | number | boolean>;
  sound?: boolean | "default";
};

const CARDIO_MILESTONES = [
  { percent: 25, title: "25% concluídos", body: "Primeiro marco atingido. Mantenha seu ritmo!" },
  { percent: 50, title: "Metade do cardio!", body: "Você chegou à metade. Continue firme, está indo muito bem!" },
  { percent: 75, title: "Falta pouco!", body: "75% concluídos. Mais um pouco e missão cumprida!" },
  { percent: 100, title: "Cardio concluído!", body: "Excelente trabalho! Você completou o tempo planejado." },
] as const;

export function configureNotificationPresentation() {
  if (Platform.OS === "web") return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function prepareNotificationChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(WORKOUT_CHANNEL_ID, {
    name: "Progresso dos treinos",
    description: "Avisos de descanso e progresso das sessões de cardio",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 180, 120, 180],
    sound: "default",
  });
}

export async function requestAppNotificationPermission() {
  if (Platform.OS === "web") return false;
  await prepareNotificationChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/** Envia um aviso imediato. Use este ponto único para notificações futuras do app. */
export async function notifyNow(notification: AppNotification) {
  if (Platform.OS === "web") return null;
  await prepareNotificationChannel();
  return Notifications.scheduleNotificationAsync({
    content: {
      title: notification.title,
      body: notification.body,
      data: notification.data,
      sound: notification.sound ?? "default",
    },
    trigger: null,
  });
}

/** Agenda uma notificação local para daqui a N segundos. */
export async function scheduleAppNotification(notification: AppNotification, secondsFromNow: number) {
  if (Platform.OS === "web" || secondsFromNow <= 0) return null;
  await prepareNotificationChannel();
  return Notifications.scheduleNotificationAsync({
    content: {
      title: notification.title,
      body: notification.body,
      data: notification.data,
      sound: notification.sound ?? "default",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, Math.ceil(secondsFromNow)),
      channelId: WORKOUT_CHANNEL_ID,
    },
  });
}

export async function cancelAppNotifications(ids: string[]) {
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined)));
}

/**
 * Agenda marcos em 25%, 50%, 75% e 100% do tempo total.
 * Retorna os IDs para cancelar caso o aluno pause ou encerre o cardio.
 */
export async function scheduleCardioMilestones(durationSeconds: number, elapsedSeconds = 0) {
  const permitted = await requestAppNotificationPermission();
  if (!permitted) return { ids: [] as string[], permissionGranted: false };

  const ids: string[] = [];
  for (const milestone of CARDIO_MILESTONES) {
    const milestoneAt = durationSeconds * milestone.percent / 100;
    const remaining = milestoneAt - elapsedSeconds;
    if (remaining <= 1) continue;

    const id = await scheduleAppNotification({
      title: milestone.title,
      body: milestone.body,
      data: { type: "cardio-progress", percent: milestone.percent },
      sound: "default",
    }, remaining);
    if (id) ids.push(id);
  }

  return { ids, permissionGranted: true };
}
