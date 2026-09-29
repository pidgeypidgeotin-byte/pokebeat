import { useEffect } from "react";
import { AppState, Platform } from "react-native";

import { useGame } from "@/lib/game-store";
import { fetchCurrentPlayback } from "@/lib/spotify";
import { getPetOverlay } from "pokebeat-pet-overlay";
import { registerSpotifyBackgroundSync, unregisterSpotifyBackgroundSync } from "@/lib/spotify-background";

export function SpotifySync() {
  const { state, setSpotifyPlayback, flushPendingMusic, awardListeningMinutes } = useGame();

  useEffect(() => {
    flushPendingMusic();
    if (!state.music.connected) return;
    let stopped = false;
    const consumeOverlayProgress = () => {
      if (Platform.OS !== "android") return;
      try { const minutes = Math.floor(getPetOverlay().consumePendingPlaybackMs() / 60_000); if (minutes > 0) awardListeningMinutes(minutes); } catch { /* overlay module is optional on web and preview */ }
    };
    const sync = async () => {
      try {
        consumeOverlayProgress();
        const playback = await fetchCurrentPlayback();
        if (!stopped && playback) setSpotifyPlayback(playback);
        if (!stopped) flushPendingMusic();
      } catch {
        // The screen shows the last known playback; a transient API failure must not break the game.
      }
    };
    void sync();
    const timer = setInterval(() => void sync(), 20_000);
    if (Platform.OS !== "web") void registerSpotifyBackgroundSync();
    const appState = AppState.addEventListener("change", (next) => { if (next === "active") void sync(); });
    return () => { stopped = true; clearInterval(timer); appState.remove(); };
  }, [state.music.connected, setSpotifyPlayback, flushPendingMusic, awardListeningMinutes]);

  useEffect(() => () => { if (Platform.OS !== "web") void unregisterSpotifyBackgroundSync(); }, []);
  return null;
}
