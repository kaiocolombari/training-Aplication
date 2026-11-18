import { Tabs } from "expo-router";
import { CalendarDays, ChartNoAxesCombined, House, UserRound } from "lucide-react-native";

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
          tabBarIcon: ({ color, size }) => <House color={color} size={size} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="treinos"
        options={{
          title: "Treinos",
          tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="evolucao"
        options={{
          title: "Evolução",
          tabBarIcon: ({ color, size }) => <ChartNoAxesCombined color={color} size={size} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} strokeWidth={2.2} />,
        }}
      />
    </Tabs>
  );
}
