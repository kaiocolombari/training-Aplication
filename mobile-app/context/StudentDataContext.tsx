import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { useAuth } from "@/context/AuthContext";
import {
  studentService,
  type StudentDashboardData,
  type StudentNotification,
  type StudentFeedback,
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
};

type StudentDataContextValue = {
  data: StudentDashboardData;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  unreadNotifications: number;
  todayWorkout: StudentDashboardData["workouts"][number] | null;
  refresh: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  registerVolumeMonth: (cycleId: string, mesCiclo: number, seriesInformadas: number, observacao: string) => Promise<void>;
  submitFeedback: (payload: { personalId: string | null; categoria: StudentFeedback["categoria"]; nota: number; comentario: string }) => Promise<void>;
};

const StudentDataContext = createContext<StudentDataContextValue | null>(null);

export function StudentDataProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [data, setData] = useState(EMPTY_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const result = await studentService.getDashboard(user.alunoId);
      setData(result);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Não foi possível carregar seus dados.";
      setError(message);
      throw cause;
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.alunoId, user?.statusCadastro]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.statusCadastro !== "APROVADO") {
      setData(EMPTY_DATA);
      setError(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    void refresh().catch(() => undefined);
  }, [authLoading, user?.alunoId, user?.statusCadastro, refresh]);

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
    markNotificationRead,
    markAllNotificationsRead,
    registerVolumeMonth,
    submitFeedback,
  }), [data, isLoading, isRefreshing, error, todayWorkout, refresh, markNotificationRead, markAllNotificationsRead, registerVolumeMonth, submitFeedback]);

  return <StudentDataContext.Provider value={value}>{children}</StudentDataContext.Provider>;
}

export function useStudentData() {
  const context = useContext(StudentDataContext);
  if (!context) throw new Error("useStudentData precisa ser usado dentro de StudentDataProvider.");
  return context;
}
