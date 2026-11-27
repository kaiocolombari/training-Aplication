import { Tabs } from "expo-router";
import { CalendarDays, ChartNoAxesCombined, House, UserRound } from "lucide-react-native";
import { useEffect } from "react";
import type { ColorValue } from "react-native";
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

function TabIcon({ icon: Icon, color, size, focused }: { icon: typeof House; color: ColorValue; size: number; focused: boolean }) {
  const scale = useSharedValue(focused ? 1.08 : 1);
  const indicator = useSharedValue(focused ? 1 : 0);
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const indicatorStyle = useAnimatedStyle(() => ({ opacity: indicator.value, transform: [{ scaleX: indicator.value }] }));

  useEffect(() => {
    // Reanimated shared values are updated here to keep tab feedback on the UI thread.
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withSpring(focused ? 1.08 : 1, { damping: 16, stiffness: 240, reduceMotion: ReduceMotion.System });
    // eslint-disable-next-line react-hooks/immutability
    indicator.value = withSpring(focused ? 1 : 0, { damping: 18, stiffness: 260, reduceMotion: ReduceMotion.System });
  }, [focused, indicator, scale]);

  return <Animated.View className="items-center" style={iconStyle}><Icon color={color} size={size} strokeWidth={2.2} /><Animated.View style={indicatorStyle} className="mt-1 h-[3px] w-3 rounded-full bg-[#A3C75D]" /></Animated.View>;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#17211B",
        tabBarInactiveTintColor: "#92968E",
        tabBarLabelStyle: { fontSize: 10, fontWeight: "700", marginTop: 2 },
        tabBarStyle: {
          height: 82,
          paddingTop: 10,
          paddingBottom: 12,
          backgroundColor: "#FBFAF7",
          borderTopColor: "#E3E0D8",
          borderTopWidth: 1,
        },
        tabBarItemStyle: { gap: 2 },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Hoje",
          tabBarIcon: ({ color, size, focused }) => <TabIcon icon={House} color={color} size={size} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="treinos"
        options={{
          title: "Treinos",
          tabBarIcon: ({ color, size, focused }) => <TabIcon icon={CalendarDays} color={color} size={size} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="evolucao"
        options={{
          title: "Evolução",
          tabBarIcon: ({ color, size, focused }) => <TabIcon icon={ChartNoAxesCombined} color={color} size={size} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size, focused }) => <TabIcon icon={UserRound} color={color} size={size} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
