import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { GameProvider } from "@/lib/game-store";
import { SpotifySync } from "@/components/spotify-sync";

export default function RootLayout() {
  return (
    <GameProvider>
      <SpotifySync />
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0d0b1b" } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="oauth/callback" />
      </Stack>
    </GameProvider>
  );
}
