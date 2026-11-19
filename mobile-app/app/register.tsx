import { useState } from "react";
import { router } from "expo-router";
import { ArrowLeft, ArrowRight, Dumbbell, Eye, EyeOff, Mail, Phone, UserRound } from "lucide-react-native";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiError } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

export default function RegisterScreen() {
  const { registerStudent } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister() {
    setError("");
    if (name.trim().length < 2 || !email.trim() || !phone.trim() || !password || !confirmPassword) {
      setError("Preencha todos os campos para continuar.");
      return;
    }
    if (password.length < 8) {
      setError("A senha deve possuir pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      await registerStudent({
        nomeCompleto: name.trim(),
        email: email.trim(),
        telefone: phone.trim(),
        senha: password,
      });
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Não foi possível criar sua conta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-[#F3F1EB]">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="grow justify-center px-6 py-8">
          <Pressable onPress={() => router.back()} className="mb-6 h-10 w-10 items-center justify-center rounded-full border border-line bg-white"><ArrowLeft color="#29332B" size={18} /></Pressable>
          <View className="mb-7 flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-ink"><Dumbbell color="#C8EF73" size={21} /></View>
            <View><Text className="text-[14px] font-black tracking-[1.6px] text-ink">TREINO SYSTEM</Text><Text className="mt-0.5 text-[9px] font-bold uppercase tracking-[1.6px] text-[#858A82]">Novo aluno</Text></View>
          </View>

          <Text className="text-[10px] font-extrabold uppercase tracking-[2px] text-[#78816F]">Etapa 01 · Criar acesso</Text>
          <Text className="mt-3 text-[31px] font-black leading-[36px] tracking-[-1px] text-ink">Comece sua jornada.</Text>
          <Text className="mt-2 text-[12px] leading-5 text-[#777D74]">Crie sua conta para responder ao formulário e aguardar a aprovação da equipe.</Text>

          <View className="mt-7 gap-4">
            <Field label="Nome completo" icon={<UserRound color="#8A9086" size={17} />} value={name} onChangeText={setName} placeholder="Como podemos te chamar?" autoComplete="name" />
            <Field label="Telefone" icon={<Phone color="#8A9086" size={17} />} value={phone} onChangeText={setPhone} placeholder="(16) 99999-9999" keyboardType="phone-pad" autoComplete="tel" />
            <Field label="E-mail" icon={<Mail color="#8A9086" size={17} />} value={email} onChangeText={setEmail} placeholder="voce@exemplo.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
            <View>
              <Text className="mb-2 text-[10px] font-extrabold uppercase tracking-[1.4px] text-[#70766D]">Senha</Text>
              <View className="h-14 flex-row items-center gap-3 rounded-2xl border border-line bg-white px-4">
                <TextInput value={password} onChangeText={setPassword} placeholder="Mínimo de 8 caracteres" placeholderTextColor="#A1A69D" secureTextEntry={!showPassword} autoComplete="new-password" className="flex-1 text-[13px] text-ink" />
                <Pressable onPress={() => setShowPassword((value) => !value)} hitSlop={10}>{showPassword ? <EyeOff color="#8A9086" size={17} /> : <Eye color="#8A9086" size={17} />}</Pressable>
              </View>
            </View>
            <View>
              <Text className="mb-2 text-[10px] font-extrabold uppercase tracking-[1.4px] text-[#70766D]">Confirmar senha</Text>
              <TextInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Digite a senha novamente" placeholderTextColor="#A1A69D" secureTextEntry={!showPassword} className="h-14 rounded-2xl border border-line bg-white px-4 text-[13px] text-ink" />
            </View>
          </View>

          {error ? <Text accessibilityRole="alert" className="mt-4 rounded-xl border border-[#D9AAA2] bg-[#F8EAE6] px-4 py-3 text-[11px] leading-5 text-[#914C43]">{error}</Text> : null}
          <Pressable onPress={handleRegister} disabled={loading} className={`mt-6 h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-lime ${loading ? "opacity-50" : "active:opacity-80"}`}>
            <Text className="text-[13px] font-extrabold text-ink">{loading ? "Criando conta..." : "Criar conta e continuar"}</Text>
            {!loading ? <ArrowRight color="#17211B" size={17} /> : null}
          </Pressable>
          <Pressable onPress={() => router.replace("/login")} className="mt-5 flex-row items-center justify-center py-2">
            <Text className="text-[11px] font-semibold text-[#687263]">Já tem conta? <Text className="font-extrabold text-ink">Fazer login</Text></Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  autoComplete,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoComplete?: "name" | "tel" | "email";
}) {
  return (
    <View>
      <Text className="mb-2 text-[10px] font-extrabold uppercase tracking-[1.4px] text-[#70766D]">{label}</Text>
      <View className="h-14 flex-row items-center gap-3 rounded-2xl border border-line bg-white px-4">
        {icon}
        <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#A1A69D" keyboardType={keyboardType} autoCapitalize={autoCapitalize} autoComplete={autoComplete} className="flex-1 text-[13px] text-ink" />
      </View>
    </View>
  );
}
