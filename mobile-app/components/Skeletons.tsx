import { useEffect, type ReactNode } from "react";
import { View, type ViewStyle } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

export function SkeletonPulse({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(reduceMotion ? 0.82 : 0.62);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  useEffect(() => {
    if (reduceMotion) return;

    // The pulse is a single UI-thread animation shared by every placeholder in this group.
    // eslint-disable-next-line react-hooks/immutability
    opacity.value = withRepeat(
      withTiming(1, { duration: 920, easing: Easing.inOut(Easing.quad), reduceMotion: ReduceMotion.System }),
      -1,
      true,
    );
    return () => cancelAnimation(opacity);
  }, [opacity, reduceMotion]);

  return (
    <Animated.View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Carregando conteúdo"
      className={className}
      style={animatedStyle}
    >
      {children}
    </Animated.View>
  );
}

export function SkeletonBlock({
  width = "100%",
  height = 12,
  radius = 8,
  className = "",
}: {
  width?: ViewStyle["width"];
  height?: number;
  radius?: number;
  className?: string;
}) {
  return <View className={`bg-[#E7E5DD] ${className}`} style={{ width, height, borderRadius: radius }} />;
}

export function HomeSectionsSkeleton() {
  return (
    <SkeletonPulse className="mt-1">
      <View className="rounded-[22px] border border-line bg-white px-3 py-3">
        {[0, 1, 2, 3].map((item) => (
          <View key={item} className="flex-row items-center gap-3 py-2.5">
            <SkeletonBlock width={40} height={40} radius={12} />
            <View className="flex-1 gap-2">
              <SkeletonBlock width={item % 2 ? "58%" : "72%"} height={10} />
              <SkeletonBlock width="38%" height={7} />
            </View>
            <SkeletonBlock width={36} height={18} radius={99} />
          </View>
        ))}
      </View>
      <SkeletonBlock width={92} height={17} className="mb-3 mt-6" />
      <View className="mt-4 flex-row gap-3">
        {[0, 1].map((item) => (
          <View key={item} className="min-h-[112px] flex-1 rounded-[22px] border border-line bg-white p-4">
            <SkeletonBlock width="72%" height={8} />
            <SkeletonBlock width="44%" height={28} radius={8} className="mt-4" />
            <SkeletonBlock width="62%" height={7} className="mt-2" />
          </View>
        ))}
      </View>
    </SkeletonPulse>
  );
}

export function WorkoutListSkeleton() {
  return (
    <SkeletonPulse>
      <View className="gap-3">
        {[0, 1, 2].map((item) => (
          <View key={item} className="rounded-[24px] border border-line bg-white p-4">
            <View className="flex-row items-start gap-3">
              <SkeletonBlock width={48} height={48} radius={16} />
              <View className="flex-1 gap-2 pt-1">
                <SkeletonBlock width={item === 1 ? "52%" : "68%"} height={12} />
                <SkeletonBlock width="42%" height={8} />
                <View className="mt-2 flex-row gap-3"><SkeletonBlock width={72} height={8} /><SkeletonBlock width={64} height={8} /></View>
              </View>
            </View>
          </View>
        ))}
      </View>
    </SkeletonPulse>
  );
}

export function ScheduleSkeleton() {
  return (
    <SkeletonPulse>
      <View className="rounded-[24px] border border-line bg-white px-4 py-3">
        {[0, 1, 2, 3, 4].map((item) => (
          <View key={item} className={`flex-row items-center gap-3 py-3 ${item < 4 ? "border-b border-[#F0EEE8]" : ""}`}>
            <SkeletonBlock width={44} height={44} radius={14} />
            <View className="flex-1 gap-2"><SkeletonBlock width={item % 2 ? "54%" : "70%"} height={10} /><SkeletonBlock width="40%" height={7} /></View>
            <SkeletonBlock width={16} height={16} radius={8} />
          </View>
        ))}
      </View>
    </SkeletonPulse>
  );
}

export function EvolutionSkeleton() {
  return (
    <SkeletonPulse className="mt-6">
      <View className="flex-row items-center justify-between">
        <SkeletonBlock width={118} height={22} radius={99} />
        <SkeletonBlock width={82} height={10} />
      </View>
      <View className="mt-3 flex-row gap-3">
        {[0, 1].map((item) => (
          <View key={item} className="min-h-[112px] flex-1 rounded-[22px] border border-line bg-white p-4">
            <SkeletonBlock width="72%" height={8} />
            <SkeletonBlock width="52%" height={28} radius={8} className="mt-4" />
            <SkeletonBlock width="64%" height={7} className="mt-2" />
          </View>
        ))}
      </View>
      <View className="mt-4 rounded-[24px] border border-line bg-white p-5">
        <SkeletonBlock width="46%" height={10} />
        <SkeletonBlock width="34%" height={30} className="mt-4" />
        <View className="mt-6 h-32 flex-row items-end justify-between gap-3 border-b border-[#EAE8E1] pb-2">
          {[38, 66, 48, 82, 58, 92].map((height, index) => <SkeletonBlock key={index} width="12%" height={height} radius={7} />)}
        </View>
      </View>
      <View className="mt-4 rounded-[24px] border border-line bg-white p-4">
        <SkeletonBlock width="42%" height={10} />
        {[0, 1, 2].map((item) => <View key={item} className="mt-4 flex-row items-center gap-3"><SkeletonBlock width={36} height={36} radius={12} /><View className="flex-1 gap-2"><SkeletonBlock width="62%" height={9} /><SkeletonBlock width="40%" height={7} /></View></View>)}
      </View>
    </SkeletonPulse>
  );
}

export function WorkoutDetailSkeleton() {
  return (
    <SkeletonPulse>
      <View className="mt-7 rounded-[28px] bg-[#26332B] p-6">
        <SkeletonBlock width={112} height={22} radius={99} className="bg-white/15" />
        <SkeletonBlock width="76%" height={30} radius={8} className="mt-6 bg-white/15" />
        <SkeletonBlock width="48%" height={10} className="mt-3 bg-white/15" />
        <View className="mt-7 flex-row gap-5"><SkeletonBlock width={84} height={10} className="bg-white/15" /><SkeletonBlock width={88} height={10} className="bg-white/15" /></View>
      </View>
      {[0, 1, 2, 3].map((item) => (
        <View key={item} className="mt-3 rounded-[20px] border border-line bg-white p-4">
          <View className="flex-row items-center gap-3"><SkeletonBlock width={36} height={36} radius={12} /><View className="flex-1 gap-2"><SkeletonBlock width={item === 2 ? "52%" : "68%"} height={10} /><SkeletonBlock width="44%" height={8} /></View><SkeletonBlock width={38} height={10} /></View>
        </View>
      ))}
      <SkeletonBlock height={54} radius={16} className="mt-5" />
    </SkeletonPulse>
  );
}

export function TeamSkeleton() {
  return (
    <SkeletonPulse>
      <View className="rounded-[22px] bg-ink p-4">
        <View className="flex-row items-center gap-3"><SkeletonBlock width={44} height={44} radius={99} className="bg-white/15" /><View className="flex-1 gap-2"><SkeletonBlock width="54%" height={10} className="bg-white/15" /><SkeletonBlock width="76%" height={8} className="bg-white/10" /></View><SkeletonBlock width={18} height={18} radius={9} className="bg-white/15" /></View>
      </View>
    </SkeletonPulse>
  );
}

export function AppBootSkeleton() {
  return (
    <View className="flex-1 items-center justify-center bg-[#F3F1EB] px-8">
      <SkeletonPulse className="w-full max-w-[300px] items-center">
        <View className="h-16 w-16 items-center justify-center rounded-[22px] bg-ink"><View className="h-7 w-7 rounded-lg bg-lime/80" /></View>
        <SkeletonBlock width={154} height={11} className="mt-5" />
        <SkeletonBlock width={108} height={8} className="mt-2" />
        <View className="mt-10 w-full rounded-[24px] border border-line bg-white p-5">
          <SkeletonBlock width="48%" height={9} />
          <SkeletonBlock width="76%" height={22} radius={8} className="mt-4" />
          <SkeletonBlock width="58%" height={8} className="mt-3" />
          <SkeletonBlock height={44} radius={14} className="mt-6" />
        </View>
      </SkeletonPulse>
    </View>
  );
}

export function NotificationListSkeleton() {
  return (
    <SkeletonPulse className="mt-6">
      {[0, 1, 2, 3].map((item) => (
        <View key={item} className="mb-3 rounded-[22px] border border-line bg-white p-4">
          <View className="flex-row items-center justify-between"><SkeletonBlock width={82} height={8} /><SkeletonBlock width={68} height={7} /></View>
          <SkeletonBlock width={item === 1 ? "62%" : "76%"} height={12} className="mt-4" />
          <SkeletonBlock width="92%" height={8} className="mt-2" />
          <SkeletonBlock width="68%" height={8} className="mt-1.5" />
        </View>
      ))}
    </SkeletonPulse>
  );
}

export function ChatMessagesSkeleton() {
  return (
    <SkeletonPulse className="gap-4 py-4">
      {[0, 1, 2, 3, 4].map((item) => (
        <View key={item} className={`max-w-[84%] rounded-[20px] p-4 ${item % 2 ? "self-start bg-white" : "self-end bg-[#E7EBDD]"}`}>
          <SkeletonBlock width={item % 2 ? 154 : 186} height={8} />
          <SkeletonBlock width={item % 2 ? 112 : 142} height={8} className="mt-2" />
          <SkeletonBlock width={48} height={6} className="mt-3 self-end" />
        </View>
      ))}
    </SkeletonPulse>
  );
}

export function CalendarEventsSkeleton() {
  return (
    <SkeletonPulse className="py-3">
      {[0, 1, 2].map((item) => (
        <View key={item} className="mb-3 flex-row items-center gap-3"><SkeletonBlock width={9} height={9} radius={5} /><View className="flex-1 gap-2"><SkeletonBlock width={item === 1 ? "48%" : "66%"} height={8} /><SkeletonBlock width="38%" height={7} /></View></View>
      ))}
    </SkeletonPulse>
  );
}
