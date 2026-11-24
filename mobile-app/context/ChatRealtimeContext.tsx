import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { HubConnection } from "@microsoft/signalr";
import { useAuth } from "./AuthContext";
import { useStudentData } from "./StudentDataContext";
import { createChatConnection, startChatConnection } from "@/services/chatRealtimeService";

const ChatRealtimeContext = createContext<HubConnection | null>(null);

export function ChatRealtimeProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const { refreshChat } = useStudentData();
  const [connection, setConnection] = useState<HubConnection | null>(null);

  useEffect(() => {
    if (isLoading || user?.tipo !== "ALUNO" || user.statusCadastro !== "APROVADO") return;
    const realtime = createChatConnection();
    let active = true;
    const onNewMessage = (event: { mensagemId?: string }) => {
      if (event.mensagemId) void realtime.invoke("ConfirmarEntrega", event.mensagemId).catch(() => undefined);
      void refreshChat().catch(() => undefined);
    };
    realtime.on("NovaMensagem", onNewMessage);
    void startChatConnection(realtime)
      .then(() => { if (active) setConnection(realtime); })
      .catch(() => undefined);
    return () => {
      active = false;
      realtime.off("NovaMensagem", onNewMessage);
      setConnection(current => current === realtime ? null : current);
      void realtime.stop();
    };
  }, [isLoading, user?.usuarioId, user?.tipo, user?.statusCadastro, refreshChat]);

  return <ChatRealtimeContext.Provider value={connection}>{children}</ChatRealtimeContext.Provider>;
}

export function useChatRealtime() {
  return useContext(ChatRealtimeContext);
}
