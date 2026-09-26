import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { GameProvider } from "@/lib/game-store";

export default function RootLayout() {
  return (
    <GameProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0d0b1b" } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="oauth/callback" />
      </Stack>
    </GameProvider>
  );
}
