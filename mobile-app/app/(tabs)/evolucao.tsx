import { ActivityIndicator, Alert, Modal, Pressable, Text, TextInput, View } from "react-native";
import { useState } from "react";
import { ArrowUpRight, CalendarDays, ChartNoAxesCombined, Scale, Target, TrendingDown, TrendingUp } from "lucide-react-native";

import { AppScreen, Eyebrow, MetricCard, SectionTitle, Tag } from "@/components/ui";
import AssessmentCalendar from "@/components/AssessmentCalendar";
import { DataUnavailableNotice } from "@/components/DataUnavailableNotice";
import { useStudentData } from "@/context/StudentDataContext";

function formatWeight(value: number) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export default function EvolutionScreen() {
  const { data, isLoading, error, refresh, registerVolumeMonth } = useStudentData();
  const avaliacoesIndisponiveis = data.unavailableSections.includes("avaliacoes");
  const execucoesIndisponiveis = data.unavailableSections.includes("execucoes") || data.workouts.length === 0;
  const volumeIndisponivel = data.unavailableSections.includes("volume");
  const [volumeModalOpen, setVolumeModalOpen] = useState(false);
  const [volumeSeries, setVolumeSeries] = useState("");
  const [volumeObservation, setVolumeObservation] = useState("");
  const [savingVolume, setSavingVolume] = useState(false);
  const weightHistory = data.evaluations.filter((item) => typeof item.peso === "number");
  const latestWeight = weightHistory.at(-1);
  const firstWeight = weightHistory[0];
  const weightDifference = weightHistory.length > 1 && latestWeight && firstWeight
    ? latestWeight.peso! - firstWeight.peso!
    : null;
  const completedSessions = data.executions.filter((item) => item.fim).length;
  const recentWeights = weightHistory.slice(-6);
  const weightValues = recentWeights.map((item) => item.peso!);
  const minWeight = weightValues.length ? Math.min(...weightValues) : 0;
  const maxWeight = weightValues.length ? Math.max(...weightValues) : 0;
  const weightRange = Math.max(0.5, maxWeight - minWeight);

  const strengthByExercise = new Map<string, { first: number; latest: number; date: string }>();
  for (const execution of data.executions) {
    if (!execution.fim) continue;
    for (const exercise of execution.exercicios) {
      const loads = exercise.series.filter((set) => set.concluida && set.carga > 0).map((set) => set.carga);
      if (!loads.length) continue;
      const bestLoad = Math.max(...loads);
      const current = strengthByExercise.get(exercise.nome);
      if (!current) strengthByExercise.set(exercise.nome, { first: bestLoad, latest: bestLoad, date: execution.data });
      else {
        current.latest = bestLoad;
        current.date = execution.data;
      }
    }
  }
  const strength = [...strengthByExercise.entries()]
    .map(([name, item]) => ({ name, ...item, change: item.first > 0 ? (item.latest - item.first) / item.first * 100 : 0 }))
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, 5);
  const activeVolumeCycle = data.volumeCycles.find((cycle) => !cycle.encerrado) ?? data.volumeCycles[0];
  const latestVolumeMonth = activeVolumeCycle?.meses.filter((month) => month.series !== null && month.series !== undefined).at(-1);
  const nextVolumeMonth = activeVolumeCycle?.meses.find((month) => month.podeRegistrar);

  async function saveVolumeRecord() {
    const value = Number.parseInt(volumeSeries, 10);
    if (!activeVolumeCycle || !nextVolumeMonth || !Number.isInteger(value) || value < 0 || value > 1000) {
      Alert.alert("Quantidade inválida", "Informe um número inteiro de séries entre 0 e 1000.");
      return;
    }
    setSavingVolume(true);
    try {
      await registerVolumeMonth(activeVolumeCycle.id, nextVolumeMonth.mesCiclo, value, volumeObservation);
      setVolumeModalOpen(false);
      setVolumeSeries("");
      setVolumeObservation("");
      Alert.alert("Registro enviado", "Seu acompanhamento mensal de volume foi atualizado.");
    } catch (cause) {
      Alert.alert("Não foi possível registrar", cause instanceof Error ? cause.message : "Tente novamente.");
    } finally {
      setSavingVolume(false);
    }
  }

  return (
    <AppScreen>
      <View className="pt-4"><Eyebrow>ACOMPANHAMENTO</Eyebrow><Text className="mt-2 text-[30px] font-black tracking-[-1px] text-ink">Sua evolução</Text><Text className="mt-1 text-[12px] text-muted">Resultados registrados nas suas avaliações e sessões.</Text></View>

      {error ? <Pressable onPress={() => void refresh().catch(() => undefined)} className="mt-5 rounded-2xl border border-[#E8D8CE] bg-[#FBF1EA] p-4"><Text className="text-[11px] font-bold text-[#8D4F3E]">Falha ao atualizar seus dados</Text><Text className="mt-1 text-[10px] text-[#8D6254]">{error} · Toque para tentar novamente.</Text></Pressable> : null}

      {!isLoading && error && data.evaluations.length === 0 && data.executions.length === 0 && data.volumeCycles.length === 0 ? (
        <View className="mt-5"><DataUnavailableNotice title="Sua evolução está indisponível" detail="Não há dados anteriores para exibir e a consulta atual falhou. Nenhum resultado foi substituído por zero." onRetry={() => void refresh().catch(() => undefined)} /></View>
      ) : null}

      {isLoading ? (
        <View className="mt-8 items-center rounded-[24px] border border-line bg-white p-8"><ActivityIndicator color="#526447" /><Text className="mt-3 text-[10px] text-muted">Carregando sua evolução...</Text></View>
      ) : error && data.evaluations.length === 0 && data.executions.length === 0 && data.volumeCycles.length === 0 ? null : (
        <>
          <View className="mt-6 flex-row items-center justify-between"><Tag tone="lime">{avaliacoesIndisponiveis ? "AVALIAÇÕES INDISPONÍVEIS" : `${weightHistory.length} AVALIAÇÕES`}</Tag><View className="flex-row items-center gap-1"><CalendarDays color="#858A82" size={13} /><Text className="text-[10px] font-semibold text-muted">{latestWeight ? new Date(latestWeight.realizadaEm).toLocaleDateString("pt-BR") : avaliacoesIndisponiveis ? "Data indisponível" : "Sem registros"}</Text></View></View>
          <View className="mt-3 flex-row gap-3">
            <MetricCard label="Peso atual" value={latestWeight?.peso != null ? formatWeight(latestWeight.peso) : "—"} unit={latestWeight?.peso != null ? "kg" : undefined} caption={weightDifference === null ? "Sem comparação" : `${weightDifference > 0 ? "+" : ""}${formatWeight(weightDifference)} kg no período`} />
            <MetricCard label="Treinos concluídos" value={execucoesIndisponiveis ? "—" : String(completedSessions)} caption={execucoesIndisponiveis ? "Histórico indisponível" : "Sessões sincronizadas"} />
          </View>

          {avaliacoesIndisponiveis ? <DataUnavailableNotice title="Calendário de avaliações indisponível" detail="Não foi possível consultar o histórico de avaliações." /> : <AssessmentCalendar evaluations={data.evaluations} />}

          <SectionTitle action={weightDifference !== null ? <View className="flex-row items-center gap-1">{weightDifference <= 0 ? <TrendingDown color="#6B8154" size={14} /> : <TrendingUp color="#A85F45" size={14} />}<Text className={`text-[10px] font-bold ${weightDifference <= 0 ? "text-[#6B8154]" : "text-[#A85F45]"}`}>{weightDifference > 0 ? "+" : ""}{formatWeight(weightDifference)} kg</Text></View> : undefined}>Peso corporal</SectionTitle>
          <View className="rounded-[24px] border border-line bg-white p-5">
            <View className="flex-row items-end justify-between"><View><Text className="text-[30px] font-black tracking-[-1px] text-ink">{latestWeight?.peso != null ? formatWeight(latestWeight.peso) : "—"} <Text className="text-[12px] font-semibold text-muted">kg</Text></Text><Text className="mt-1 text-[10px] text-muted">{latestWeight ? `Avaliação ${latestWeight.numero}` : "O peso aparecerá após sua primeira avaliação."}</Text></View><View className="rounded-xl bg-[#EDF2E5] p-2"><Scale color="#627B4A" size={19} /></View></View>
            {recentWeights.length > 0 ? (
              <View className="mt-6 h-36 flex-row items-end justify-between gap-2 border-b border-[#EAE8E1] pb-2">
                {recentWeights.map((item, index) => {
                  const value = item.peso!;
                  const height = 28 + ((value - minWeight) / weightRange) * 82;
                  return <View key={item.id} className="flex-1 items-center justify-end gap-2"><Text className={`text-[9px] font-bold ${index === recentWeights.length - 1 ? "text-ink" : "text-[#A1A49D]"}`}>{formatWeight(value)}</Text><View className={`w-full rounded-t-lg ${index === recentWeights.length - 1 ? "bg-lime" : "bg-[#E5E9DF]"}`} style={{ height }} /><Text className="text-[8px] font-bold text-muted">{new Date(item.realizadaEm).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "").toUpperCase()}</Text></View>;
                })}
              </View>
            ) : <View className="mt-5 rounded-xl bg-[#F5F4EF] p-4"><Text className="text-[10px] leading-4 text-muted">{avaliacoesIndisponiveis ? "O histórico de peso está indisponível no momento." : "Ainda não existem avaliações com peso registrado. Seus dados aparecerão aqui quando o personal cadastrar a avaliação."}</Text></View>}
            {avaliacoesIndisponiveis ? <View className="mt-4"><DataUnavailableNotice compact title="Avaliações indisponíveis" detail="Não foi possível consultar suas medidas. O peso não será estimado." /></View> : null}
            {latestWeight?.percentualGordura != null ? <Text className="mt-3 text-[10px] text-muted">Percentual de gordura na última avaliação: {latestWeight.percentualGordura.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</Text> : null}
          </View>

          <SectionTitle>Força nos exercícios</SectionTitle>
          <View className="rounded-[24px] border border-line bg-white px-4">
            {execucoesIndisponiveis ? <View className="py-5"><DataUnavailableNotice compact title="Histórico de treinos indisponível" detail="Não foi possível calcular a evolução de carga. Tente atualizar os dados." onRetry={() => void refresh().catch(() => undefined)} /></View> : strength.length > 0 ? strength.map((item, index) => (
              <View key={item.name} className={`flex-row items-center py-4 ${index < strength.length - 1 ? "border-b border-[#F0EEE8]" : ""}`}>
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-[#EDF2E5]"><Target color="#6A8053" size={17} /></View>
                <View className="ml-3 flex-1"><Text className="text-[12px] font-bold text-ink">{item.name}</Text><Text className="mt-1 text-[10px] text-muted">Maior carga registrada: {item.latest.toLocaleString("pt-BR")} kg</Text></View>
                <View className={`flex-row items-center gap-1 rounded-full px-2.5 py-1.5 ${item.change >= 0 ? "bg-[#EDF2E5]" : "bg-[#F7EFEB]"}`}><ArrowUpRight color={item.change >= 0 ? "#627B4A" : "#A45F4D"} size={12} /><Text className={`text-[10px] font-extrabold ${item.change >= 0 ? "text-[#627B4A]" : "text-[#A45F4D]"}`}>{item.change > 0 ? "+" : ""}{item.change.toFixed(0)}%</Text></View>
              </View>
            )) : <View className="py-5"><Text className="text-[11px] font-bold text-ink">Sem registros de força</Text><Text className="mt-1 text-[10px] leading-4 text-muted">Quando você concluir e sincronizar sessões, a evolução de carga aparecerá aqui.</Text></View>}
          </View>

          {volumeIndisponivel ? <View className="mt-4"><DataUnavailableNotice title="Acompanhamento de volume indisponível" detail="Os ciclos de volume não puderam ser consultados. Seus outros indicadores continuam disponíveis." onRetry={() => void refresh().catch(() => undefined)} /></View> : activeVolumeCycle ? (
            <>
              <SectionTitle>Acompanhamento de volume</SectionTitle>
              <View className="rounded-[22px] border border-line bg-white p-4">
                <Text className="text-[12px] font-extrabold text-ink">{activeVolumeCycle.treinoNome}</Text>
                <Text className="mt-1 text-[10px] text-muted">Referência inicial: {activeVolumeCycle.referenciaSeries} séries · Início {new Date(`${activeVolumeCycle.dataInicio}T00:00:00`).toLocaleDateString("pt-BR")}</Text>
                <View className="mt-3 flex-row items-center justify-between rounded-xl bg-[#F3F2EC] p-3"><Text className="text-[9px] font-bold text-[#858A82]">ÚLTIMO REGISTRO</Text><Text className="text-[15px] font-black text-ink">{latestVolumeMonth?.series ?? activeVolumeCycle.referenciaSeries} séries</Text></View>
                {latestVolumeMonth?.observacao ? <Text className="mt-2 text-[10px] leading-4 text-muted">{latestVolumeMonth.observacao}</Text> : null}
                {nextVolumeMonth ? <Pressable onPress={() => { setVolumeSeries(String(activeVolumeCycle.referenciaSeries)); setVolumeModalOpen(true); }} className="mt-4 h-11 items-center justify-center rounded-xl bg-lime"><Text className="text-[10px] font-extrabold text-ink">Registrar mês {nextVolumeMonth.mesCiclo}</Text></Pressable> : null}
              </View>
            </>
          ) : null}

          <View className="mt-4 rounded-[22px] bg-[#E9E6DD] p-4"><View className="flex-row items-center gap-2"><ChartNoAxesCombined color="#56634F" size={16} /><Text className="text-[11px] font-extrabold text-ink">{error ? "Últimos dados disponíveis" : "Acompanhamento atualizado"}</Text></View><Text className="mt-1 text-[10px] leading-4 text-[#777D74]">Os indicadores são construídos com as avaliações e execuções registradas na sua conta. Converse com seu personal sobre os próximos ajustes.</Text></View>
        </>
      )}

      <Modal visible={volumeModalOpen} transparent animationType="fade" onRequestClose={() => setVolumeModalOpen(false)}>
        <View className="flex-1 items-center justify-center bg-black/45 px-5">
          <View className="w-full rounded-[24px] bg-white p-5">
            <Text className="text-[17px] font-black text-ink">Registro mensal de volume</Text>
            <Text className="mt-1 text-[10px] leading-4 text-muted">Informe o total de séries semanais realizadas no mês {nextVolumeMonth?.mesCiclo} deste ciclo.</Text>
            <Text className="mt-4 text-[9px] font-extrabold uppercase tracking-[1px] text-[#737B6F]">Séries realizadas</Text>
            <TextInput value={volumeSeries} onChangeText={setVolumeSeries} keyboardType="number-pad" placeholder="Ex.: 48" placeholderTextColor="#9A9E95" className="mt-2 h-12 rounded-xl bg-[#F3F1EB] px-4 text-[14px] font-bold text-ink" />
            <Text className="mt-4 text-[9px] font-extrabold uppercase tracking-[1px] text-[#737B6F]">Observação (opcional)</Text>
            <TextInput value={volumeObservation} onChangeText={setVolumeObservation} maxLength={500} multiline textAlignVertical="top" placeholder="Como foi seu volume neste mês?" placeholderTextColor="#9A9E95" className="mt-2 min-h-[84px] rounded-xl bg-[#F3F1EB] px-4 py-3 text-[11px] text-ink" />
            <View className="mt-5 flex-row gap-2">
              <Pressable onPress={() => setVolumeModalOpen(false)} disabled={savingVolume} className="h-11 flex-1 items-center justify-center rounded-xl border border-line"><Text className="text-[10px] font-bold text-muted">Cancelar</Text></Pressable>
              <Pressable onPress={() => void saveVolumeRecord()} disabled={savingVolume} className="h-11 flex-1 items-center justify-center rounded-xl bg-lime">{savingVolume ? <ActivityIndicator color="#17211B" size="small" /> : <Text className="text-[10px] font-extrabold text-ink">Enviar registro</Text>}</Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}
