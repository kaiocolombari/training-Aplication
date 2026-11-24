import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Clock3, Dumbbell, Info, Play, Repeat2 } from "lucide-react-native";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";

import { AppScreen, Eyebrow, IconButton, PrimaryButton, SectionTitle, Tag } from "@/components/ui";
import { useStudentData } from "@/context/StudentDataContext";
import { useWorkout } from "@/context/WorkoutContext";

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error, refresh } = useStudentData();
  const { activeSession, beginWorkout } = useWorkout();
  const workout = data.workouts.find((item) => item.id === id);

  function start() {
    if (!workout) return;
    if (workout.exercises.length === 0) {
      Alert.alert("Treino sem exercícios", "Seu personal ainda não adicionou exercícios a esta ficha.");
      return;
    }
    if (activeSession && activeSession.workoutId !== workout.id) {
      Alert.alert("Trocar de treino?", "Existe uma sessão salva. Ao iniciar este treino, a sessão anterior será substituída.", [
        { text: "Continuar sessão salva", style: "cancel" },
        { text: "Trocar treino", style: "destructive", onPress: () => { beginWorkout(workout); router.push("/execucao"); } },
      ]);
      return;
    }
    if (!activeSession) beginWorkout(workout);
    router.push("/execucao");
  }

  if (isLoading) {
    return <AppScreen><View className="flex-1 items-center justify-center py-20"><ActivityIndicator color="#526447" /><Text className="mt-3 text-[11px] text-muted">Carregando prescrição...</Text></View></AppScreen>;
  }

  if (error || !workout) {
    return (
      <AppScreen>
        <View className="flex-row items-center justify-between pt-3"><IconButton onPress={() => router.back()}><ArrowLeft color="#17211B" size={19} /></IconButton><Eyebrow>DETALHES DO TREINO</Eyebrow><View className="w-11" /></View>
        <View className="mt-10 rounded-[24px] border border-dashed border-line bg-white p-5">
          <Text className="text-[13px] font-extrabold text-ink">Não foi possível abrir esta ficha</Text>
          <Text className="mt-2 text-[11px] leading-5 text-muted">{error ?? "O treino não está mais disponível ou não pertence à sua conta."}</Text>
          <Pressable onPress={() => void refresh().catch(() => undefined)} className="mt-4 rounded-xl bg-lime p-3"><Text className="text-center text-[11px] font-extrabold text-ink">Tentar novamente</Text></Pressable>
        </View>
      </AppScreen>
    );
  }

  const totalSets = workout.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);

  return (
    <AppScreen>
      <View className="flex-row items-center justify-between pt-3">
        <IconButton onPress={() => router.back()}><ArrowLeft color="#17211B" size={19} /></IconButton>
        <Eyebrow>DETALHES DO TREINO</Eyebrow>
        <View className="w-11" />
      </View>

      <View className="mt-7 overflow-hidden rounded-[28px] bg-ink p-6">
        <View className="absolute -right-8 -top-8 h-40 w-40 rounded-full border-[25px] border-white/[0.04]" />
        <Tag tone="lime">{workout.day ? `TREINO · ${workout.day}` : "FICHA ATUAL"}</Tag>
        <Text className="mt-5 text-[32px] font-black tracking-[-1.2px] text-white">{workout.name}</Text>
        <Text className="mt-1 text-[12px] text-white/60">{workout.subtitle}</Text>
        <Text className="mt-5 text-[11px] font-semibold text-lime">{workout.focus}</Text>
        <View className="mt-5 flex-row gap-5 border-t border-white/10 pt-4">
          <View className="flex-row items-center gap-2"><Clock3 color="#C8EF73" size={15} /><Text className="text-[11px] font-semibold text-white">~{workout.duration} min</Text></View>
          <View className="flex-row items-center gap-2"><Dumbbell color="#C8EF73" size={15} /><Text className="text-[11px] font-semibold text-white">{workout.exercises.length} exercícios</Text></View>
          <View className="flex-row items-center gap-2"><Repeat2 color="#C8EF73" size={15} /><Text className="text-[11px] font-semibold text-white">{totalSets} séries</Text></View>
        </View>
        <Text className="mt-3 text-[9px] text-white/40">Tempo aproximado calculado com base nas séries e intervalos prescritos.</Text>
      </View>

      <SectionTitle>Sequência do treino</SectionTitle>
      {workout.exercises.map((exercise, index) => (
        <View key={exercise.id} className="mb-2 rounded-[20px] border border-line bg-white p-4">
          <View className="flex-row items-center gap-3">
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-[#F0F1E9]"><Text className="text-[12px] font-black text-[#66745C]">{String(index + 1).padStart(2, "0")}</Text></View>
            <View className="flex-1"><Text className="text-[12px] font-bold text-ink">{exercise.name}</Text><Text className="mt-1 text-[10px] text-muted">{exercise.sets} séries · {exercise.reps} reps · {exercise.rest}</Text></View>
            <Text className="text-[10px] font-bold text-[#6C765F]">{exercise.load} kg</Text>
          </View>
          {exercise.note ? <Text className="ml-12 mt-2 text-[10px] leading-4 text-muted">{exercise.note}</Text> : null}
          {exercise.variations?.length ? (
            <View className="ml-12 mt-3 rounded-xl bg-[#F4F3ED] p-3">
              <Text className="text-[9px] font-extrabold uppercase tracking-[0.8px] text-[#69745F]">{exercise.variations.length} variações disponíveis</Text>
              {exercise.variations.map((variation) => <Text key={variation.id} className="mt-1 text-[10px] text-[#626A5E]">• {variation.name}</Text>)}
            </View>
          ) : null}
        </View>
      ))}

      <View className="mt-4 rounded-[20px] bg-[#E9E6DD] p-4">
        <View className="flex-row items-center gap-2"><Info color="#69745F" size={16} /><Text className="text-[11px] font-extrabold text-ink">Como funciona</Text></View>
        <Text className="mt-2 text-[10px] leading-5 text-[#71776D]">O app conduz você exercício por exercício. Registre carga, repetições e RIR em cada série. Se precisar parar, salve o estado e continue depois do ponto em que parou.</Text>
      </View>

      <View className="mb-6 mt-5"><PrimaryButton title={activeSession?.workoutId === workout.id ? "Continuar este treino" : "Iniciar sessão"} onPress={start} icon={<Play color="#17211B" size={17} fill="#17211B" />} /></View>
    </AppScreen>
  );
}
