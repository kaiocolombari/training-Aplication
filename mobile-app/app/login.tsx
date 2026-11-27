import { useState } from "react";
import { Fingerprint, LockKeyhole, Mail, Eye, EyeOff, Dumbbell, ArrowRight, MessageCircle } from "lucide-react-native";
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiError } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

const whatsappUrl = process.env.EXPO_PUBLIC_WHATSAPP_CONTACT_URL;

export default function LoginScreen() {
  const {
    login,
    biometricLogin,
    biometricAvailable,
    biometricEnabled,
    rememberMe: rememberedSession,
    rememberedEmail,
  } = useAuth();
  const [email, setEmail] = useState(rememberedEmail);
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(rememberedSession);
  const [enableBiometric, setEnableBiometric] = useState(biometricEnabled);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setError("");
    if (!email.trim() || !password) {
      console.warn("[AUTH][screen] login blocked: missing email or password", {
        emailPresent: Boolean(email.trim()),
        passwordPresent: Boolean(password),
      });
      setError("Informe seu e-mail e senha para continuar.");
      return;
    }
    console.info("[AUTH][screen] login started", {
      emailLength: email.trim().length,
      passwordLength: password.length,
      rememberMe,
      enableBiometric,
    });
    setLoading(true);
    try {
      await login({ email: email.trim(), senha: password }, rememberMe, enableBiometric);
      console.info("[AUTH][screen] login flow completed");
    } catch (cause) {
      console.warn("[AUTH][screen] login failed", {
        errorType: cause instanceof Error ? cause.name : typeof cause,
        status: cause instanceof ApiError ? cause.status : undefined,
        message: cause instanceof Error ? cause.message : "Unknown error",
      });
      setError(cause instanceof ApiError ? cause.message : "Não foi possível entrar. Tente novamente.");
    } finally {
      setLoading(false);
      console.info("[AUTH][screen] login loading released");
    }
  }

  async function handleBiometric() {
    setError("");
    setLoading(true);
    try {
      await biometricLogin();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Não foi possível validar sua biometria.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-[#F3F1EB]">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="grow justify-center px-6 py-8">
          <View className="mb-8 flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-ink"><Dumbbell color="#C8EF73" size={23} strokeWidth={2.5} /></View>
            <View>
              <Text className="text-[15px] font-black tracking-[1.8px] text-ink">TREINO SYSTEM</Text>
              <Text className="mt-0.5 text-[9px] font-bold uppercase tracking-[2px] text-[#858A82]">Área do aluno</Text>
            </View>
          </View>

          <View className="overflow-hidden rounded-[30px] bg-ink p-6">
            <View className="absolute -right-14 -top-16 h-48 w-48 rounded-full border-[26px] border-white/[0.04]" />
            <Text className="text-[10px] font-extrabold uppercase tracking-[2px] text-lime">Bem-vindo de volta</Text>
            <Text className="mt-3 text-[31px] font-black leading-[36px] tracking-[-1px] text-white">Seu próximo treino começa aqui.</Text>
            <Text className="mt-3 text-[12px] leading-5 text-white/55">Entre para acompanhar seu planejamento e registrar sua evolução.</Text>
          </View>

          <View className="mt-7 gap-4">
            <View>
              <Text className="mb-2 text-[10px] font-extrabold uppercase tracking-[1.4px] text-[#70766D]">E-mail</Text>
              <View className="h-14 flex-row items-center gap-3 rounded-2xl border border-line bg-white px-4">
                <Mail color="#8A9086" size={17} />
                <TextInput value={email} onChangeText={setEmail} placeholder="voce@exemplo.com" placeholderTextColor="#A1A69D" autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" className="flex-1 text-[13px] text-ink" />
              </View>
            </View>

            <View>
              <Text className="mb-2 text-[10px] font-extrabold uppercase tracking-[1.4px] text-[#70766D]">Senha</Text>
              <View className="h-14 flex-row items-center gap-3 rounded-2xl border border-line bg-white px-4">
                <LockKeyhole color="#8A9086" size={17} />
                <TextInput value={password} onChangeText={setPassword} placeholder="Sua senha" placeholderTextColor="#A1A69D" secureTextEntry={!showPassword} autoComplete="current-password" textContentType="password" onSubmitEditing={handleLogin} returnKeyType="go" className="flex-1 text-[13px] text-ink" />
                <Pressable onPress={() => setShowPassword((value) => !value)} hitSlop={10}>
                  {showPassword ? <EyeOff color="#8A9086" size={17} /> : <Eye color="#8A9086" size={17} />}
                </Pressable>
              </View>
            </View>
          </View>

          <Pressable onPress={() => setRememberMe((value) => !value)} className="mt-4 flex-row items-center gap-3 self-start py-1">
            <View className={`h-5 w-5 items-center justify-center rounded-md border ${rememberMe ? "border-ink bg-ink" : "border-[#B9BDB4] bg-white"}`}>
              {rememberMe ? <Text className="text-[12px] font-black text-lime">✓</Text> : null}
            </View>
            <View>
              <Text className="text-[11px] font-bold text-ink">Lembrar de mim</Text>
              <Text className="mt-0.5 text-[9px] text-[#858A82]">Manter minha sessão neste aparelho</Text>
            </View>
          </Pressable>

          {biometricAvailable ? (
            <Pressable onPress={() => setEnableBiometric((value) => !value)} className="mt-3 flex-row items-center gap-3 self-start py-1">
              <View className={`h-5 w-5 items-center justify-center rounded-md border ${enableBiometric ? "border-ink bg-ink" : "border-[#B9BDB4] bg-white"}`}>
                {enableBiometric ? <Text className="text-[12px] font-black text-lime">✓</Text> : null}
              </View>
              <View>
                <Text className="text-[11px] font-bold text-ink">Ativar acesso por biometria</Text>
                <Text className="mt-0.5 text-[9px] text-[#858A82]">Use digital ou reconhecimento facial na próxima vez</Text>
              </View>
            </Pressable>
          ) : null}

          {error ? <Text accessibilityRole="alert" className="mt-4 rounded-xl border border-[#D9AAA2] bg-[#F8EAE6] px-4 py-3 text-[11px] leading-5 text-[#914C43]">{error}</Text> : null}

          <Pressable onPress={handleLogin} disabled={loading} className={`mt-6 h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-lime ${loading ? "opacity-50" : "active:opacity-80"}`}>
            <Text className="text-[13px] font-extrabold text-ink">{loading ? "Entrando..." : "Entrar na minha conta"}</Text>
            {!loading ? <ArrowRight color="#17211B" size={17} /> : null}
          </Pressable>

          {biometricEnabled && biometricAvailable ? (
            <Pressable onPress={handleBiometric} disabled={loading} className="mt-3 h-14 flex-row items-center justify-center gap-2 rounded-2xl border border-[#D9DDD3] bg-white">
              <Fingerprint color="#526447" size={19} />
              <Text className="text-[12px] font-extrabold text-ink">{loading ? "Validando..." : "Entrar com biometria"}</Text>
            </Pressable>
          ) : null}

          {whatsappUrl ? <Pressable onPress={() => void Linking.openURL(whatsappUrl).catch(() => setError("Não foi possível abrir o WhatsApp neste aparelho."))} className="mt-7 flex-row items-center justify-center gap-2 py-2"><MessageCircle color="#687263" size={15}/><Text className="text-[11px] font-bold text-[#687263]">Ainda não tem convite? <Text className="font-extrabold text-ink">Falar com a equipe</Text></Text></Pressable> : <Text className="mt-7 text-center text-[10px] leading-5 text-[#858A82]">O acesso é criado por convite. Solicite seu link diretamente a um profissional da equipe.</Text>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
