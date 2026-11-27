import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { useAuth } from "@/context/AuthContext";
import { useWorkout } from "@/context/WorkoutContext";
import {
  studentService,
  type StudentDashboardData,
  type StudentNotification,
  type StudentFeedback,
  type MissingVideoReport,
} from "@/services/studentService";

const EMPTY_DATA: StudentDashboardData = {
  workouts: [],
  schedule: [],
  periodization: null,
  evaluations: [],
  executions: [],
  volumeCycles: [],
  notifications: [],
  personals: [],
  feedbacks: [],
  feedbackPersonals: [],
  unavailableSections: [],
};

const DASHBOARD_CACHE_PREFIX = "@treino-system/dashboard:v1";

function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dashboardCacheKey(studentId: string) {
  return `${DASHBOARD_CACHE_PREFIX}:${studentId}:${localDateKey()}`;
}

type DashboardCache = {
  date: string;
  catalogVersion: string | null;
  savedAt: string;
  data: StudentDashboardData;
};

function compactDashboardData(value: StudentDashboardData): StudentDashboardData {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffKey = localDateKey(cutoff);
  return {
    ...value,
    evaluations: value.evaluations.slice(-12),
    executions: value.executions.filter(item => item.data.slice(0, 10) >= cutoffKey).slice(-100),
    volumeCycles: value.volumeCycles.slice(-6),
    notifications: value.notifications.slice(0, 30),
    feedbacks: value.feedbacks.slice(0, 30),
  };
}

type StudentDataContextValue = {
  data: StudentDashboardData;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  unreadNotifications: number;
  todayWorkout: StudentDashboardData["workouts"][number] | null;
  refresh: () => Promise<void>;
  refreshChat: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  registerVolumeMonth: (cycleId: string, mesCiclo: number, seriesInformadas: number, observacao: string) => Promise<void>;
  submitFeedback: (payload: { personalId: string | null; categoria: StudentFeedback["categoria"]; nota: number; comentario: string }) => Promise<void>;
  reportMissingVideo: (payload: MissingVideoReport) => Promise<void>;
};

const StudentDataContext = createContext<StudentDataContextValue | null>(null);

export function StudentDataProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const { syncSessionVideos } = useWorkout();
  const [data, setData] = useState(EMPTY_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheReady, setCacheReady] = useState(false);
  const [cacheHasData, setCacheHasData] = useState(false);
  const studentIdRef = useRef<string | null>(null);
  const catalogVersionRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user?.alunoId || user.statusCadastro !== "APROVADO") {
      setData(EMPTY_DATA);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsRefreshing(true);
    setError(null);
    try {
      const currentStudentId = user.alunoId;
      const [result, catalogVersion] = await Promise.all([
        studentService.getDashboard(currentStudentId),
        studentService.getCatalogVersion().catch(() => null),
      ]);
      if (studentIdRef.current !== currentStudentId) return;
      syncSessionVideos(result.workouts);
      setData(result);
      setCacheHasData(true);
      catalogVersionRef.current = catalogVersion;
      await AsyncStorage.setItem(dashboardCacheKey(currentStudentId), JSON.stringify({
        date: localDateKey(),
        catalogVersion,
        savedAt: new Date().toISOString(),
        data: compactDashboardData(result),
      } satisfies DashboardCache)).catch(() => undefined);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Não foi possível carregar seus dados.";
      setError(message);
      throw cause;
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.alunoId, user?.statusCadastro, syncSessionVideos]);

  const refreshChat = useCallback(async () => {
    if (!user?.alunoId || user.statusCadastro !== "APROVADO") return;
    const [personals, notifications] = await Promise.all([
      studentService.listPersonalConversations(),
      studentService.listChatNotifications(),
    ]);
    setData(current => ({ ...current, personals, notifications: [...notifications].sort((a, b) => b.criadaEm.localeCompare(a.criadaEm)) }));
  }, [user?.alunoId, user?.statusCadastro]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !user.alunoId || user.statusCadastro !== "APROVADO") {
      studentIdRef.current = null;
      setData(EMPTY_DATA);
      setError(null);
      setIsLoading(false);
      setCacheReady(false);
      setCacheHasData(false);
      return;
    }
    const studentId = user.alunoId;
    let mounted = true;
    studentIdRef.current = studentId;
    setCacheReady(false);
    setCacheHasData(false);
    setData(EMPTY_DATA);
    setError(null);
    setIsLoading(true);

    async function hydrate() {
      const key = dashboardCacheKey(studentId);
      try {
        const [saved, keys] = await Promise.all([
          AsyncStorage.getItem(key),
          AsyncStorage.getAllKeys(),
        ]);
        if (!mounted || studentIdRef.current !== studentId) return;
        const cache = saved ? JSON.parse(saved) as DashboardCache : null;
        if (cache?.date === localDateKey() && cache.data) {
          setData(cache.data);
          setCacheHasData(true);
          catalogVersionRef.current = cache.catalogVersion ?? null;
          setIsLoading(false);
        } else {
          setData(EMPTY_DATA);
        }
        setCacheReady(true);

        const staleKeys = keys.filter(item => item.startsWith(`${DASHBOARD_CACHE_PREFIX}:${studentId}:`) && item !== key);
        if (staleKeys.length) await AsyncStorage.multiRemove(staleKeys);

        if (!cache || cache.date !== localDateKey()) {
          await refresh();
          return;
        }

        const latestVersion = await studentService.getCatalogVersion().catch(() => null);
        if (mounted && latestVersion && latestVersion !== cache.catalogVersion) {
          await refresh();
        }
      } catch (cause) {
        if (!mounted) return;
        setCacheReady(true);
        await refresh().catch(() => undefined);
      }
    }

    void hydrate();
    return () => { mounted = false; };
  }, [authLoading, user?.alunoId, user?.statusCadastro, refresh]);

  useEffect(() => {
    if (!cacheReady || !cacheHasData || !user?.alunoId || user.statusCadastro !== "APROVADO" || studentIdRef.current !== user.alunoId) return;
    const cache: DashboardCache = {
      date: localDateKey(),
      catalogVersion: catalogVersionRef.current,
      savedAt: new Date().toISOString(),
      data: compactDashboardData(data),
    };
    AsyncStorage.setItem(dashboardCacheKey(user.alunoId), JSON.stringify(cache)).catch(() => undefined);
  }, [cacheReady, cacheHasData, data, user?.alunoId, user?.statusCadastro]);

  useEffect(() => {
    if (!user?.alunoId || user.statusCadastro !== "APROVADO") return;
    let checking = false;
    const checkCatalog = async () => {
      if (checking || AppState.currentState !== "active") return;
      checking = true;
      try {
        const version = await studentService.getCatalogVersion();
        if (version !== catalogVersionRef.current) {
          await refresh();
        }
      } catch {
        // A indisponibilidade do endpoint de versão não afeta o cache nem a sessão ativa.
      } finally {
        checking = false;
      }
    };
    const interval = setInterval(() => { void checkCatalog(); }, 90_000);
    const subscription = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active") void checkCatalog();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [user?.alunoId, user?.statusCadastro, refresh]);

  const markNotificationRead = useCallback(async (id: string) => {
    await studentService.markNotificationRead(id);
    const readAt = new Date().toISOString();
    setData((current) => ({
      ...current,
      notifications: current.notifications.map((item) =>
        item.id === id ? { ...item, lidaEm: readAt } : item,
      ),
    }));
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    await studentService.markAllNotificationsRead();
    const readAt = new Date().toISOString();
    setData((current) => ({
      ...current,
      notifications: current.notifications.map((item: StudentNotification) => ({ ...item, lidaEm: item.lidaEm ?? readAt })),
    }));
  }, []);

  const registerVolumeMonth = useCallback(async (cycleId: string, mesCiclo: number, seriesInformadas: number, observacao: string) => {
    await studentService.registerVolumeMonth(cycleId, mesCiclo, seriesInformadas, observacao);
    await refresh();
  }, [refresh]);

  const submitFeedback = useCallback(async (payload: { personalId: string | null; categoria: StudentFeedback["categoria"]; nota: number; comentario: string }) => {
    const created = await studentService.createFeedback(payload);
    setData((current) => ({
      ...current,
      feedbacks: [created, ...current.feedbacks.filter((item) => item.id !== created.id)],
    }));
  }, []);

  const reportMissingVideo = useCallback(async (payload: MissingVideoReport) => {
    const created = await studentService.reportMissingVideo(payload);
    setData(current => ({
      ...current,
      feedbacks: [created, ...current.feedbacks.filter(item => item.id !== created.id)],
    }));
  }, []);

  const todayWorkout = useMemo(() => {
    const today = new Date();
    const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    return data.schedule.find((day) => day.date === key)?.workouts[0] ?? null;
  }, [data.schedule]);

  const value = useMemo<StudentDataContextValue>(() => ({
    data,
    isLoading,
    isRefreshing,
    error,
    unreadNotifications: data.notifications.filter((item) => !item.lidaEm).length,
    todayWorkout,
    refresh,
    refreshChat,
    markNotificationRead,
    markAllNotificationsRead,
    registerVolumeMonth,
    submitFeedback,
    reportMissingVideo,
  }), [data, isLoading, isRefreshing, error, todayWorkout, refresh, refreshChat, markNotificationRead, markAllNotificationsRead, registerVolumeMonth, submitFeedback, reportMissingVideo]);

  return <StudentDataContext.Provider value={value}>{children}</StudentDataContext.Provider>;
}

export function useStudentData() {
  const context = useContext(StudentDataContext);
  if (!context) throw new Error("useStudentData precisa ser usado dentro de StudentDataProvider.");
  return context;
}
