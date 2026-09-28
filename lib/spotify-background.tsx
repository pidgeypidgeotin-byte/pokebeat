import AsyncStorage from "@react-native-async-storage/async-storage";
import * as BackgroundTask from "expo-background-task";
import * as TaskManager from "expo-task-manager";
import { Platform } from "react-native";

import { fetchCurrentPlayback } from "@/lib/spotify";

export const SPOTIFY_BACKGROUND_TASK = "pokebeat-spotify-playback-sync";
const STORAGE_KEY = "pokebeat-save-v4";

TaskManager.defineTask(SPOTIFY_BACKGROUND_TASK, async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) return BackgroundTask.BackgroundTaskResult.Success;
    const state = JSON.parse(stored);
    if (!state.music?.connected) return BackgroundTask.BackgroundTaskResult.Success;
    const playback = await fetchCurrentPlayback();
    if (!playback) return BackgroundTask.BackgroundTaskResult.Success;
    const previous = state.music;
    const sameTrack = previous.lastTrackId && previous.lastTrackId === playback.trackId;
    const delta = sameTrack && previous.lastIsPlaying && playback.isPlaying && playback.progressMs > previous.lastProgressMs
      ? Math.min(playback.progressMs - previous.lastProgressMs, 120_000)
      : 0;
    state.music = {
      ...previous,
      currentTrack: playback.track,
      currentArtist: playback.artist,
      currentAlbum: playback.album,
      lastProgressMs: playback.progressMs,
      lastDurationMs: playback.durationMs,
      lastIsPlaying: playback.isPlaying,
      lastTrackId: playback.trackId,
      pendingPlaybackMs: (previous.pendingPlaybackMs ?? 0) + delta,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, lastSavedAt: Date.now() }));
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerSpotifyBackgroundSync() {
  if (Platform.OS === "web") return;
  try {
    const registered = await TaskManager.isTaskRegisteredAsync(SPOTIFY_BACKGROUND_TASK);
    if (!registered) await BackgroundTask.registerTaskAsync(SPOTIFY_BACKGROUND_TASK);
  } catch {
    // Background scheduling is best effort and controlled by Android/iOS power policy.
  }
}

export async function unregisterSpotifyBackgroundSync() {
  if (Platform.OS === "web") return;
  try {
    if (await TaskManager.isTaskRegisteredAsync(SPOTIFY_BACKGROUND_TASK)) await BackgroundTask.unregisterTaskAsync(SPOTIFY_BACKGROUND_TASK);
  } catch {
    // Ignore task cleanup failures during logout.
  }
}
