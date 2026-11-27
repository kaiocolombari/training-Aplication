import { useEffect } from "react";
import { Text, View } from "react-native";
import { Dumbbell, Sparkles } from "lucide-react-native";
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export function WorkoutLoadingCard() {
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(0.82);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      rotation.value = 0;
      pulse.value = 1;
      return;
    }
    rotation.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.linear, reduceMotion: ReduceMotion.System }), -1, false);
    pulse.value = withRepeat(withSequence(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease), reduceMotion: ReduceMotion.System }),
      withTiming(0.82, { duration: 900, easing: Easing.inOut(Easing.ease), reduceMotion: ReduceMotion.System }),
    ), -1, false);
    return () => { cancelAnimation(rotation); cancelAnimation(pulse); };
  }, [pulse, reduceMotion, rotation]);

  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value * 360}deg` }] }));
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value, transform: [{ scale: pulse.value }] }));

  return (
    <View className="mt-7 overflow-hidden rounded-[28px] bg-ink p-6">
      <View className="absolute -right-12 -top-14 h-48 w-48 rounded-full border-[30px] border-white/[0.04]" />
      <View className="flex-row items-center justify-between">
        <Text className="text-[9px] font-extrabold uppercase tracking-[1.7px] text-lime">PREPARANDO SUA ROTINA</Text>
        <Sparkles color="#C8EF73" size={17} />
      </View>
      <View className="mt-8 items-center">
        <View className="h-[104px] w-[104px] items-center justify-center">
          <Animated.View style={spinStyle} className="absolute h-[96px] w-[96px] rounded-full border-[2px] border-dashed border-lime/60" />
          <Animated.View style={pulseStyle} className="h-[68px] w-[68px] items-center justify-center rounded-[24px] bg-lime">
            <Dumbbell color="#17211B" size={30} strokeWidth={2.5} />
          </Animated.View>
        </View>
        <Text className="mt-5 text-[22px] font-black tracking-[-0.7px] text-white">Carregando treinos de hoje</Text>
        <Text className="mt-2 max-w-[270px] text-center text-[11px] leading-5 text-white/60">Estamos organizando seus exercícios, séries e demonstrações para deixar tudo pronto.</Text>
        <View className="mt-5 flex-row items-center gap-2">
          {[0, 1, 2].map(index => <Animated.View key={index} style={pulseStyle} className={`h-1.5 w-1.5 rounded-full ${index === 1 ? "bg-lime" : "bg-white/45"}`} />)}
        </View>
      </View>
      <Text className="mt-7 text-center text-[8px] font-bold uppercase tracking-[1.4px] text-white/35">Seus dados ficam salvos neste aparelho</Text>
    </View>
  );
}
