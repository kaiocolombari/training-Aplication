import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Clock3, Dumbbell, Info, Play, Repeat2 } from "lucide-react-native";
import { Alert, Text, View } from "react-native";

import { AppScreen, Eyebrow, IconButton, PrimaryButton, SectionTitle, Tag } from "@/components/ui";
import { useWorkout } from "@/context/WorkoutContext";
import { TODAY_WORKOUT, WORKOUTS } from "@/data/workouts";

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workout = WORKOUTS.find((item) => item.id === id) ?? TODAY_WORKOUT;
  const { activeSession, beginWorkout } = useWorkout();

  function start() {
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
        <Tag tone="lime">{workout.day === "TER" ? "TREINO DE HOJE" : "FICHA ATUAL"}</Tag>
        <Text className="mt-5 text-[32px] font-black tracking-[-1.2px] text-white">{workout.name}</Text>
        <Text className="mt-1 text-[12px] text-white/60">{workout.subtitle}</Text>
        <Text className="mt-5 text-[11px] font-semibold text-lime">{workout.focus}</Text>
        <View className="mt-5 flex-row gap-5 border-t border-white/10 pt-4">
          <View className="flex-row items-center gap-2"><Clock3 color="#C8EF73" size={15} /><Text className="text-[11px] font-semibold text-white">{workout.duration} min</Text></View>
          <View className="flex-row items-center gap-2"><Dumbbell color="#C8EF73" size={15} /><Text className="text-[11px] font-semibold text-white">{workout.exercises.length} exercícios</Text></View>
          <View className="flex-row items-center gap-2"><Repeat2 color="#C8EF73" size={15} /><Text className="text-[11px] font-semibold text-white">{totalSets} séries</Text></View>
        </View>
      </View>

      <SectionTitle>Sequência do treino</SectionTitle>
      {workout.exercises.map((exercise, index) => (
        <View key={exercise.id} className="mb-2 flex-row items-center gap-3 rounded-[20px] border border-line bg-white p-4">
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-[#F0F1E9]"><Text className="text-[12px] font-black text-[#66745C]">{String(index + 1).padStart(2, "0")}</Text></View>
          <View className="flex-1"><Text className="text-[12px] font-bold text-ink">{exercise.name}</Text><Text className="mt-1 text-[10px] text-muted">{exercise.muscle} · {exercise.sets} séries · {exercise.reps} reps</Text></View>
          <Text className="text-[10px] font-bold text-[#6C765F]">{exercise.load} kg</Text>
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
