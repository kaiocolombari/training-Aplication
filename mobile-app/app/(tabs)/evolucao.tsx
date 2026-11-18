import { ArrowUpRight, CalendarDays, ChartNoAxesCombined, Scale, Target, TrendingUp } from "lucide-react-native";
import { Text, View } from "react-native";

import { AppScreen, Eyebrow, MetricCard, SectionTitle, Tag } from "@/components/ui";

const weight = [
  { month: "JUN", value: 78.4, height: 70 },
  { month: "JUL", value: 78.0, height: 66 },
  { month: "AGO", value: 77.8, height: 63 },
  { month: "SET", value: 77.4, height: 58 },
  { month: "OUT", value: 77.1, height: 54 },
  { month: "NOV", value: 76.8, height: 50 },
];

const strength = [
  { name: "Supino reto", before: "35 kg", now: "40 kg", change: "+14%" },
  { name: "Agachamento", before: "45 kg", now: "50 kg", change: "+11%" },
  { name: "Remada curvada", before: "28 kg", now: "32 kg", change: "+14%" },
];

export default function EvolutionScreen() {
  return (
    <AppScreen>
      <View className="pt-4"><Eyebrow>ACOMPANHAMENTO</Eyebrow><Text className="mt-2 text-[30px] font-black tracking-[-1px] text-ink">Sua evolução</Text><Text className="mt-1 text-[12px] text-muted">Consistência primeiro. Os resultados vêm junto.</Text></View>

      <View className="mt-6 flex-row items-center justify-between"><Tag tone="lime">ÚLTIMOS 6 MESES</Tag><View className="flex-row items-center gap-1"><CalendarDays color="#858A82" size={13} /><Text className="text-[10px] font-semibold text-muted">Atualizado em 12 nov</Text></View></View>
      <View className="mt-3 flex-row gap-3"><MetricCard label="Peso atual" value="76,8" unit="kg" caption="−1,6 kg no período" /><MetricCard label="Treinos concluídos" value="38" caption="Desde junho" /></View>

      <SectionTitle action={<View className="flex-row items-center gap-1"><TrendingUp color="#6B8154" size={14} /><Text className="text-[10px] font-bold text-[#6B8154]">−2,0%</Text></View>}>Peso corporal</SectionTitle>
      <View className="rounded-[24px] border border-line bg-white p-5">
        <View className="flex-row items-end justify-between"><View><Text className="text-[30px] font-black tracking-[-1px] text-ink">76,8 <Text className="text-[12px] font-semibold text-muted">kg</Text></Text><Text className="mt-1 text-[10px] text-muted">Tendência gradual no período</Text></View><View className="rounded-xl bg-[#EDF2E5] p-2"><Scale color="#627B4A" size={19} /></View></View>
        <View className="mt-6 h-36 flex-row items-end justify-between gap-2 border-b border-[#EAE8E1] pb-2">
          {weight.map((item, index) => <View key={item.month} className="flex-1 items-center justify-end gap-2"><Text className={`text-[9px] font-bold ${index === weight.length - 1 ? "text-ink" : "text-[#A1A49D]"}`}>{item.value.toFixed(1).replace(".", ",")}</Text><View className={`w-full rounded-t-lg ${index === weight.length - 1 ? "bg-lime" : "bg-[#E5E9DF]"}`} style={{ height: item.height }} /><Text className="text-[9px] font-bold text-muted">{item.month}</Text></View>)}
        </View>
        <Text className="mt-3 text-[9px] leading-4 text-[#9A9D96]">Dados demonstrativos. O gráfico real será alimentado pelas avaliações registradas na ficha.</Text>
      </View>

      <SectionTitle>Força nos exercícios</SectionTitle>
      <View className="rounded-[24px] border border-line bg-white px-4">
        {strength.map((item, index) => <View key={item.name} className={`flex-row items-center py-4 ${index < strength.length - 1 ? "border-b border-[#F0EEE8]" : ""}`}><View className="h-9 w-9 items-center justify-center rounded-xl bg-[#EDF2E5]"><Target color="#6A8053" size={17} /></View><View className="ml-3 flex-1"><Text className="text-[12px] font-bold text-ink">{item.name}</Text><Text className="mt-1 text-[10px] text-muted">{item.before} <Text className="text-[#A1A49D]">→</Text> {item.now}</Text></View><View className="flex-row items-center gap-1 rounded-full bg-[#EDF2E5] px-2.5 py-1.5"><ArrowUpRight color="#627B4A" size={12} /><Text className="text-[10px] font-extrabold text-[#627B4A]">{item.change}</Text></View></View>)}
      </View>

      <View className="mt-4 rounded-[22px] bg-[#E9E6DD] p-4"><View className="flex-row items-center gap-2"><ChartNoAxesCombined color="#56634F" size={16} /><Text className="text-[11px] font-extrabold text-ink">Próxima avaliação</Text></View><Text className="mt-1 text-[10px] leading-4 text-[#777D74]">Sua próxima avaliação está prevista para 24 de novembro. Converse com seu personal para confirmar.</Text></View>
    </AppScreen>
  );
}
