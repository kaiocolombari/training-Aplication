import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function AppScreen({ children, className = "", scroll = true }: { children: ReactNode; className?: string; scroll?: boolean }) {
  return (
    <SafeAreaView edges={["top"]} className={`flex-1 bg-canvas ${className}`}>
      {scroll ? <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-5 pb-10">{children}</ScrollView> : children}
    </SafeAreaView>
  );
}

export function Eyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return <Text className={`text-[10px] font-bold uppercase tracking-[2px] ${light ? "text-lime" : "text-[#888D84]"}`}>{children}</Text>;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return <View className="mb-3 mt-7 flex-row items-center justify-between"><Text className="text-[19px] font-bold tracking-[-0.5px] text-ink">{children}</Text>{action}</View>;
}

export function PrimaryButton({ title, onPress, icon, disabled = false }: { title: string; onPress: () => void; icon?: ReactNode; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} className={`h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-lime px-5 active:opacity-80 ${disabled ? "opacity-40" : ""}`}>
      {icon}
      <Text className="text-[14px] font-extrabold text-ink">{title}</Text>
    </Pressable>
  );
}

export function ProgressTrack({ value, dark = false }: { value: number; dark?: boolean }) {
  return <View className={`h-1.5 overflow-hidden rounded-full ${dark ? "bg-white/15" : "bg-[#E5E2D9]"}`}><View className="h-full rounded-full bg-lime" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></View>;
}

export function MetricCard({ label, value, unit, caption }: { label: string; value: string; unit?: string; caption?: string }) {
  return (
    <View className="min-h-[112px] flex-1 rounded-[22px] border border-line bg-white p-4">
      <Text className="text-[10px] font-semibold uppercase tracking-[1px] text-muted">{label}</Text>
      <View className="mt-3 flex-row items-baseline gap-1"><Text className="text-[28px] font-extrabold tracking-[-1px] text-ink">{value}</Text>{unit ? <Text className="text-[11px] font-semibold text-muted">{unit}</Text> : null}</View>
      {caption ? <Text className="mt-1 text-[10px] text-muted">{caption}</Text> : null}
    </View>
  );
}

export function Tag({ children, tone = "light" }: { children: ReactNode; tone?: "light" | "dark" | "lime" }) {
  const styles = tone === "dark" ? "bg-white/10 text-white" : tone === "lime" ? "bg-lime text-ink" : "bg-[#EAE8E0] text-[#555D53]";
  return <View className={`self-start rounded-full px-3 py-1.5 ${styles}`}><Text className={`text-[9px] font-bold uppercase tracking-[1px] ${tone === "dark" ? "text-white" : "text-inherit"}`}>{children}</Text></View>;
}

export function IconButton({ children, onPress, dark = false }: { children: ReactNode; onPress: () => void; dark?: boolean }) {
  return <Pressable onPress={onPress} className={`h-11 w-11 items-center justify-center rounded-full ${dark ? "bg-white/10" : "border border-line bg-white"}`}>{children}</Pressable>;
}
