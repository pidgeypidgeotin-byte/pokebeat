import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const tabs = [
  { name: "index", title: "Inicio", icon: "home-outline" as const, active: "home" as const },
  { name: "music", title: "Música", icon: "musical-notes-outline" as const, active: "musical-notes" as const },
  { name: "collection", title: "Colección", icon: "sparkles-outline" as const, active: "sparkles" as const },
  { name: "pokedex", title: "Pokédex", icon: "book-outline" as const, active: "book" as const },
  { name: "quests", title: "Misiones", icon: "flag-outline" as const, active: "flag" as const },
  { name: "play", title: "Jugar", icon: "game-controller-outline" as const, active: "game-controller" as const },
];

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottom = Platform.OS === "web" ? 10 : Math.max(insets.bottom, 8);
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: "#d6ceff", tabBarInactiveTintColor: "#77728f", tabBarStyle: { backgroundColor: "#15122a", borderTopColor: "#2e294d", height: 58 + bottom, paddingBottom: bottom, paddingTop: 7 }, tabBarLabelStyle: { fontSize: 10, fontWeight: "700" } }}>
      {tabs.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title, tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? tab.active : tab.icon} size={size} color={color} /> }} />
      ))}
    </Tabs>
  );
}
