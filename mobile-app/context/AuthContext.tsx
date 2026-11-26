import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { Alert, Platform } from "react-native";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  clearAuthTokens,
  getCurrentAuthTokens,
  restoreAuthTokens,
  setAuthTokens,
} from "@/services/api";
import { ApiError } from "@/services/api";
import { unregisterChatPushToken } from "@/services/notifications";
import {
  authService,
  type AuthUser,
  type LoginPayload,
  type RegisterStudentPayload,
} from "@/services/authService";

const REMEMBER_KEY = "@treino-system/remember-me";
const REMEMBERED_EMAIL_KEY = "@treino-system/remembered-email";
const BIOMETRIC_ENABLED_KEY = "@treino-system/biometric-enabled";
const BIOMETRIC_VERSION_KEY = "@treino-system/biometric-version";
const BIOMETRIC_REFRESH_TOKEN_KEY = "treino-system-biometric-refresh-token";
const LEGACY_BIOMETRIC_CREDENTIALS_KEY = "treino-system-biometric-login";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  rememberMe: boolean;
  rememberedEmail: string;
  biometricAvailable: boolean;
  biometricEnabled: boolean;
  login: (payload: LoginPayload, remember: boolean, enableBiometric: boolean) => Promise<void>;
  biometricLogin: () => Promise<void>;
  registerStudent: (payload: RegisterStudentPayload) => Promise<void>;
  submitRegistrationAnswers: (answers: Record<string, string>) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  const [rememberedEmail, setRememberedEmail] = useState("");
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        const biometricVersion = await AsyncStorage.getItem(BIOMETRIC_VERSION_KEY);
        if (biometricVersion !== "2") {
          // Version 1 stored the user's password; require a fresh opt-in with a refresh token.
          await Promise.all([
            SecureStore.deleteItemAsync(LEGACY_BIOMETRIC_CREDENTIALS_KEY).catch(() => undefined),
            SecureStore.deleteItemAsync(BIOMETRIC_REFRESH_TOKEN_KEY).catch(() => undefined),
            AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY),
          ]);
          await AsyncStorage.setItem(BIOMETRIC_VERSION_KEY, "2");
        }
        if (Platform.OS !== "web") {
          const [hasHardware, enrolled] = await Promise.all([
            LocalAuthentication.hasHardwareAsync(),
            LocalAuthentication.isEnrolledAsync(),
          ]);
          if (mounted) setBiometricAvailable(hasHardware && enrolled);
        }

        const [remember, email, biometric] = await Promise.all([
          AsyncStorage.getItem(REMEMBER_KEY),
          AsyncStorage.getItem(REMEMBERED_EMAIL_KEY),
          AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY),
        ]);
        if (!mounted) return;

        const shouldRemember = remember === "true";
        setRememberMe(shouldRemember);
        setRememberedEmail(email ?? "");
        setBiometricEnabled(biometric === "true");

        // When biometrics are enabled, do not restore a usable session before user verification.
        if (shouldRemember && biometric !== "true") {
          const stored = await restoreAuthTokens();
          if (stored) {
            const currentUser = await authService.me();
            if (currentUser.tipo === "ALUNO") {
              if (mounted) setUser(currentUser);
            } else {
              await clearAuthTokens();
              await AsyncStorage.removeItem(REMEMBER_KEY);
              if (mounted) setRememberMe(false);
            }
          } else {
            await AsyncStorage.removeItem(REMEMBER_KEY);
            if (mounted) setRememberMe(false);
          }
        }
      } catch {
        await clearAuthTokens();
        await AsyncStorage.removeItem(REMEMBER_KEY);
        if (mounted) setRememberMe(false);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void initialize();
    return () => {
      mounted = false;
    };
  }, []);

  async function persistPreferences(email: string, remember: boolean) {
    setRememberMe(remember);
    if (remember) {
      await AsyncStorage.multiSet([
        [REMEMBER_KEY, "true"],
        [REMEMBERED_EMAIL_KEY, email],
      ]);
      setRememberedEmail(email);
    } else {
      await AsyncStorage.multiRemove([REMEMBER_KEY, REMEMBERED_EMAIL_KEY]);
      setRememberedEmail("");
    }
  }

  async function login(payload: LoginPayload, remember: boolean, enableBiometric: boolean) {
    const session = await authService.login(payload);
    if (session.usuario.tipo !== "ALUNO") {
      await authService.logout(session.refreshToken).catch(() => undefined);
      throw new ApiError("Este aplicativo é destinado aos alunos. Use o sistema web para acessar sua conta.", 403);
    }

    const { usuario, ...sessionTokens } = session;
    await setAuthTokens(sessionTokens, remember);
    await persistPreferences(payload.email, remember);

    if (enableBiometric && biometricAvailable && Platform.OS !== "web") {
      try {
        await SecureStore.setItemAsync(
          BIOMETRIC_REFRESH_TOKEN_KEY,
          session.refreshToken,
          {
            requireAuthentication: true,
            authenticationPrompt: "Confirme sua identidade para ativar o acesso biométrico",
          },
        );
        await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, "true");
        await AsyncStorage.setItem(BIOMETRIC_VERSION_KEY, "2");
        setBiometricEnabled(true);
      } catch {
        await SecureStore.deleteItemAsync(BIOMETRIC_REFRESH_TOKEN_KEY).catch(() => undefined);
        await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
        setBiometricEnabled(false);
        Alert.alert("Biometria não ativada", "Sua conta foi conectada, mas o acesso biométrico não pôde ser configurado neste aparelho.");
      }
    } else {
      await SecureStore.deleteItemAsync(BIOMETRIC_REFRESH_TOKEN_KEY).catch(() => undefined);
      await SecureStore.deleteItemAsync(LEGACY_BIOMETRIC_CREDENTIALS_KEY).catch(() => undefined);
      await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
      setBiometricEnabled(false);
    }

    setUser(usuario);
  }

  async function biometricLogin() {
    if (!biometricAvailable || Platform.OS === "web") {
      throw new ApiError("Este dispositivo não possui biometria configurada.");
    }

    let refreshToken: string | null;
    try {
      refreshToken = await SecureStore.getItemAsync(BIOMETRIC_REFRESH_TOKEN_KEY, {
        requireAuthentication: true,
        authenticationPrompt: "Entre no Treino System",
      });
    } catch {
      throw new ApiError("A autenticação biométrica foi cancelada ou não pôde ser concluída.");
    }
    if (!refreshToken) {
      setBiometricEnabled(false);
      await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
      throw new ApiError("A credencial biométrica não está mais disponível. Entre com sua senha.");
    }

    let session;
    try {
      session = await authService.refresh(refreshToken);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await SecureStore.deleteItemAsync(BIOMETRIC_REFRESH_TOKEN_KEY).catch(() => undefined);
        await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
        setBiometricEnabled(false);
        throw new ApiError("Seu acesso biométrico expirou. Entre com sua senha para ativá-lo novamente.", 401);
      }
      throw error;
    }
    if (session.usuario.tipo !== "ALUNO") {
      await authService.logout(session.refreshToken).catch(() => undefined);
      await SecureStore.deleteItemAsync(BIOMETRIC_REFRESH_TOKEN_KEY).catch(() => undefined);
      await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
      setBiometricEnabled(false);
      throw new ApiError("Este aplicativo é destinado aos alunos.");
    }

    const remember = (await AsyncStorage.getItem(REMEMBER_KEY)) === "true";
    const { usuario, ...sessionTokens } = session;
    await setAuthTokens(sessionTokens, remember);
    try {
      await SecureStore.setItemAsync(BIOMETRIC_REFRESH_TOKEN_KEY, session.refreshToken, {
        requireAuthentication: true,
        authenticationPrompt: "Atualize sua credencial biométrica do Treino System",
      });
    } catch {
      await SecureStore.deleteItemAsync(BIOMETRIC_REFRESH_TOKEN_KEY).catch(() => undefined);
      await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
      setBiometricEnabled(false);
      Alert.alert("Biometria desativada", "Sua sessão foi iniciada, mas não foi possível atualizar a credencial protegida deste aparelho.");
    }
    setUser(usuario);
  }

  async function registerStudent(payload: RegisterStudentPayload) {
    const session = await authService.registerStudent(payload);
    const { usuario, ...sessionTokens } = session;
    await setAuthTokens(sessionTokens, false);
    await SecureStore.deleteItemAsync(BIOMETRIC_REFRESH_TOKEN_KEY).catch(() => undefined);
    await SecureStore.deleteItemAsync(LEGACY_BIOMETRIC_CREDENTIALS_KEY).catch(() => undefined);
    await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
    setBiometricEnabled(false);
    await persistPreferences(payload.email, false);
    setUser(usuario);
  }

  async function submitRegistrationAnswers(answers: Record<string, string>) {
    await authService.sendRegistrationAnswers(answers);
    await refreshUser();
  }

  const refreshUser = useCallback(async () => {
    const currentUser = await authService.me();
    setUser(currentUser);
  }, []);

  async function logout() {
    const currentTokens = getCurrentAuthTokens();
    try {
      await unregisterChatPushToken();
      if (currentTokens?.refreshToken) {
        await authService.logout(currentTokens.refreshToken);
      }
    } finally {
      await clearAuthTokens();
      await persistPreferences("", false);
      setUser(null);
    }
  }

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoading,
    rememberMe,
    rememberedEmail,
    biometricAvailable,
    biometricEnabled,
    login,
    biometricLogin,
    registerStudent,
    submitRegistrationAnswers,
    refreshUser,
    logout,
  }), [user, isLoading, rememberMe, rememberedEmail, biometricAvailable, biometricEnabled]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth precisa ser usado dentro de AuthProvider.");
  return context;
}
