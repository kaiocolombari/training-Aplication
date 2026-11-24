import {
  HubConnectionBuilder,
  HttpTransportType,
  LogLevel,
  type HubConnection,
} from "@microsoft/signalr";

import { getApiBaseUrl, getFreshAccessToken } from "./api";

export function createChatConnection(): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(`${getApiBaseUrl()}/hubs/chat`, {
      accessTokenFactory: getFreshAccessToken,
      transport: HttpTransportType.WebSockets,
      skipNegotiation: true,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 20000])
    .configureLogging(LogLevel.Warning)
    .build();
}

export async function startChatConnection(connection: HubConnection) {
  if (connection.state === "Connected") return;
  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      await connection.start();
      return;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Não foi possível conectar ao chat em tempo real.");
}
