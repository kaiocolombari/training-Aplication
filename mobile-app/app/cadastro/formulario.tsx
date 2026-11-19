import { useState } from "react";
import { router } from "expo-router";
import { ArrowRight, Dumbbell, LogOut } from "lucide-react-native";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/services/api";
import { perguntasCadastro } from "@/data/cadastroPerguntas";

export default function RegistrationQuestionnaireScreen() {
  const { user, submitRegistrationAnswers, logout } = useAuth();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    const missing = perguntasCadastro.find((question) => question.obrigatoria && !answers[question.id]?.trim());
    if (missing) {
      setError(`Responda à pergunta: ${missing.titulo}`);
      return;
    }

    setLoading(true);
    try {
      await submitRegistrationAnswers(answers);
      router.replace("/cadastro/aguardando");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Não foi possível enviar suas respostas.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-[#111312]">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="px-5 pb-10 pt-5">
          <View className="mb-8 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#A85F60]"><Dumbbell color="#FFFFFF" size={19} /></View>
              <Text className="text-[12px] font-black tracking-[1.8px] text-white">TREINO <Text className="text-[#C47C7D]">/ SYSTEM</Text></Text>
            </View>
            <Pressable onPress={() => { void logout().catch(() => undefined).then(() => router.replace("/login")); }} className="flex-row items-center gap-2 rounded-xl border border-white/10 px-3 py-2">
              <LogOut color="#FFFFFF" size={14} /><Text className="text-[10px] font-semibold text-white/70">Sair</Text>
            </Pressable>
          </View>

          <Text className="text-[10px] font-extrabold uppercase tracking-[2px] text-[#D18B8C]">Etapa 02 · Conhecendo você</Text>
          <Text className="mt-3 text-[30px] font-black leading-[36px] tracking-[-1px] text-white">Vamos entender seus objetivos.</Text>
          <Text className="mt-3 text-[12px] leading-5 text-white/60">{user?.nome}, responda algumas perguntas para que nossa equipe possa avaliar seu perfil e preparar o acompanhamento adequado.</Text>

          <View className="mt-7 gap-4">
            {perguntasCadastro.map((question, index) => (
              <View key={question.id} className="rounded-[22px] border border-white/10 bg-white/[0.045] p-4">
                <View className="mb-3 flex-row items-start gap-3">
                  <View className="h-7 w-7 items-center justify-center rounded-lg bg-[#A85F60]/20"><Text className="text-[10px] font-bold text-[#E0A4A5]">{String(index + 1).padStart(2, "0")}</Text></View>
                  <Text className="flex-1 text-[13px] font-bold leading-5 text-white">{question.titulo}{question.obrigatoria ? <Text className="text-[#D18B8C]"> *</Text> : null}</Text>
                </View>
                {question.descricao ? <Text className="mb-3 text-[11px] leading-5 text-white/45">{question.descricao}</Text> : null}

                {question.tipo === "select" ? (
                  <View className="gap-2">
                    {question.opcoes?.map((option) => {
                      const selected = answers[question.id] === option;
                      return (
                        <Pressable key={option} onPress={() => setAnswers((current) => ({ ...current, [question.id]: option }))} className={`min-h-11 flex-row items-center gap-3 rounded-xl border px-3 py-3 ${selected ? "border-[#C47C7D] bg-[#A85F60]/15" : "border-white/10 bg-black/15"}`}>
                          <View className={`h-4 w-4 items-center justify-center rounded-full border ${selected ? "border-[#D18B8C]" : "border-white/30"}`}>{selected ? <View className="h-2 w-2 rounded-full bg-[#D18B8C]" /> : null}</View>
                          <Text className={`flex-1 text-[11px] ${selected ? "font-bold text-white" : "text-white/70"}`}>{option}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : question.tipo === "textarea" ? (
                  <TextInput value={answers[question.id] ?? ""} onChangeText={(value) => setAnswers((current) => ({ ...current, [question.id]: value }))} placeholder="Escreva sua resposta..." placeholderTextColor="#777D78" multiline textAlignVertical="top" className="min-h-[112px] rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-[12px] leading-5 text-white" />
                ) : (
                  <TextInput value={answers[question.id] ?? ""} onChangeText={(value) => setAnswers((current) => ({ ...current, [question.id]: value }))} keyboardType={question.tipo === "number" ? "numeric" : "default"} placeholder="Sua resposta..." placeholderTextColor="#777D78" className="h-12 rounded-xl border border-white/10 bg-black/20 px-4 text-[12px] text-white" />
                )}
              </View>
            ))}
          </View>

          {error ? <Text accessibilityRole="alert" className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-[11px] leading-5 text-red-200">{error}</Text> : null}

          <View className="mt-6 gap-4">
            <Text className="text-[10px] leading-5 text-white/40">Suas respostas serão usadas somente durante a avaliação e removidas após a aprovação do cadastro.</Text>
            <Pressable onPress={submit} disabled={loading} className={`h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-[#A85F60] ${loading ? "opacity-50" : "active:opacity-80"}`}>
              <Text className="text-[12px] font-extrabold text-white">{loading ? "Enviando..." : "Enviar para avaliação"}</Text>
              {!loading ? <ArrowRight color="#FFFFFF" size={17} /> : null}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
