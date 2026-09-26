import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { formatNumber, GAME_CONFIG } from "@/lib/game-config";
import { useGame } from "@/lib/game-store";
import { disconnectSpotify, fetchCurrentPlayback, fetchSpotifyProfile, getSpotifyRedirectUri, isSpotifyConfigured, startSpotifyOAuth, type SpotifyPlayback } from "@/lib/spotify";

export default function MusicScreen() {
  const { state, awardListeningMinutes, setSpotifySession, setSpotifyPlayback } = useGame();
  const [busy, setBusy] = useState(false);
  const [playback, setPlayback] = useState<SpotifyPlayback | null>(null);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const previousPlayback = useRef<SpotifyPlayback | null>(null);
  const pendingListenedMs = useRef(0);
  const favorite = (playback?.artist ?? state.music.currentArtist).toLowerCase() === state.creature.favoriteArtist.toLowerCase();

  const syncPlayback = useCallback(async () => {
    try {
      const current = await fetchCurrentPlayback();
      setPlayback(current);
      if (current) {
        const previous = previousPlayback.current;
        if (previous && current.isPlaying && previous.trackId === current.trackId && current.progressMs > previous.progressMs) {
          pendingListenedMs.current += current.progressMs - previous.progressMs;
          const earnedMinutes = Math.min(2, Math.floor(pendingListenedMs.current / 60_000));
          pendingListenedMs.current %= 60_000;
          if (earnedMinutes > 0) awardListeningMinutes(earnedMinutes);
        } else if (!previous || previous.trackId !== current.trackId) {
          pendingListenedMs.current = 0;
        }
        previousPlayback.current = current;
        setSpotifyPlayback(current);
        setLastSync(Date.now());
      }
    } catch (error) {
      Alert.alert("Spotify", `No se pudo leer la reproducción actual: ${String(error)}`);
    }
  }, [awardListeningMinutes, setSpotifyPlayback]);

  useEffect(() => {
    if (!state.music.connected) return;
    void syncPlayback();
    const timer = setInterval(() => { void syncPlayback(); }, 20_000);
    return () => clearInterval(timer);
  }, [state.music.connected, syncPlayback]);

  const connect = async () => {
    setBusy(true);
    const result = await startSpotifyOAuth();
    setBusy(false);
    if (!result.ok) {
      Alert.alert("Conectar Spotify", result.message);
      return;
    }
    const profile = await fetchSpotifyProfile();
    setSpotifySession(true, profile?.displayName ?? "Cuenta Spotify");
    await syncPlayback();
    Alert.alert("Spotify conectado", "OAuth PKCE completado. PokéBeat leerá la canción actual cada 20 segundos mientras esta pantalla esté activa.");
  };

  const disconnect = async () => {
    await disconnectSpotify();
    setPlayback(null);
    setSpotifySession(false, null);
  };

  const track = playback?.track ?? state.music.currentTrack;
  const artist = playback?.artist ?? state.music.currentArtist;
  const album = playback?.album || state.music.currentAlbum;
  const progress = playback && playback.durationMs > 0 ? Math.min(1, playback.progressMs / playback.durationMs) : 0;
  const formatTime = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;

  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Text style={styles.eyebrow}>MÚSICA / SPOTIFY WEB API</Text><Text style={styles.title}>La canción real hace crecer a tu Pokémon</Text><Text style={styles.subtitle}>OAuth PKCE, tokens en Android Keystore y consulta oficial de reproducción. PokéBeat nunca descarga ni extrae audio.</Text>
    <View style={styles.nowCard}><View style={styles.nowHeader}><View style={styles.status}><View style={[styles.statusDot, state.music.connected && styles.statusConnected]} /><Text style={styles.statusText}>{state.music.connected ? "SPOTIFY CONECTADO" : "SPOTIFY SIN CONECTAR"}</Text></View><Ionicons name="musical-notes" size={21} color="#9b8cff" /></View><Text style={styles.track}>{track}</Text><Text style={styles.artist}>{artist}</Text><Text style={styles.album}>{album || "Álbum no disponible"}</Text><View style={styles.wave}>{[12, 23, 34, 18, 28, 14, 25, 10].map((height, index) => <View key={index} style={[styles.bar, { height }, playback?.isPlaying === false && styles.barPaused]} />)}</View><View style={styles.progressRow}><Text style={styles.progressText}>{playback ? formatTime(playback.progressMs) : "--:--"}</Text><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(progress * 100, playback ? 2 : 0)}%` }]} /></View><Text style={styles.progressText}>{playback ? formatTime(playback.durationMs) : "--:--"}</Text></View>{favorite && <View style={styles.favorite}><Text style={styles.favoriteStar}>★</Text><Text style={styles.favoriteText}>Artista favorito · +{Math.round((GAME_CONFIG.favoriteArtistXpMultiplier - 1) * 100)}% XP y +{Math.round((GAME_CONFIG.favoriteArtistMusicEvMultiplier - 1) * 100)}% prob. EV musical</Text></View>}{state.music.connected && !playback && <Text style={styles.emptyPlayback}>No hay una reproducción activa o Spotify no devolvió contenido. Eso es una respuesta válida de la API.</Text>}</View>
    <View style={styles.buttonRow}><Pressable onPress={connect} disabled={busy || state.music.connected} style={({ pressed }) => [styles.connectButton, state.music.connected && styles.connectedButton, pressed && styles.pressed]}><Ionicons name={state.music.connected ? "checkmark-circle" : "musical-notes-outline"} size={19} color={state.music.connected ? "#70e1bd" : "#0d0b1b"} /><Text style={[styles.connectLabel, state.music.connected && styles.connectedLabel]}>{busy ? "Abriendo Spotify…" : state.music.connected ? "Cuenta vinculada" : "Conectar Spotify"}</Text></Pressable>{state.music.connected && <><Pressable onPress={() => void syncPlayback()} style={({ pressed }) => [styles.syncButton, pressed && styles.pressed]}><Ionicons name="refresh" size={17} color="#d6ceff" /></Pressable><Pressable onPress={() => void disconnect()} style={({ pressed }) => [styles.disconnectButton, pressed && styles.pressed]}><Text style={styles.disconnectText}>Salir</Text></Pressable></>}</View>
    {isSpotifyConfigured() && <View style={styles.redirectBanner}><Text style={styles.configTitle}>REDIRECT URI DE ESTA PLATAFORMA</Text><Text selectable style={styles.configText}>{getSpotifyRedirectUri()}</Text><Text style={styles.redirectHint}>Debe coincidir exactamente con una URI registrada en Spotify Developer Dashboard.</Text></View>}
    <View style={styles.demoCard}><View style={styles.demoIcon}><Ionicons name="flash" size={18} color="#ffd477" /></View><View style={{ flex: 1 }}><Text style={styles.demoTitle}>Prueba offline</Text><Text style={styles.demoText}>Puedes validar el bucle del juego sin Spotify. Estos botones no se presentan como datos reales de Spotify.</Text></View></View><View style={styles.demoButtons}><Pressable onPress={() => awardListeningMinutes(5)} style={({ pressed }) => [styles.demoButton, pressed && styles.pressed]}><Text style={styles.demoButtonTitle}>+5 min</Text><Text style={styles.demoButtonSub}>prueba local</Text></Pressable><Pressable onPress={() => awardListeningMinutes(30)} style={({ pressed }) => [styles.demoButton, pressed && styles.pressed]}><Text style={styles.demoButtonTitle}>+30 min</Text><Text style={styles.demoButtonSub}>sesión local</Text></Pressable><Pressable onPress={() => awardListeningMinutes(60)} style={({ pressed }) => [styles.demoButton, pressed && styles.pressed]}><Text style={styles.demoButtonTitle}>+60 min</Text><Text style={styles.demoButtonSub}>sesión local</Text></Pressable></View>
    <Text style={styles.sectionTitle}>Resumen persistente</Text><View style={styles.summaryGrid}><View style={styles.summary}><Text style={styles.summaryValue}>{formatNumber(state.music.minutesListened)} min</Text><Text style={styles.summaryLabel}>Tiempo escuchado</Text></View><View style={styles.summary}><Text style={styles.summaryValue}>+{formatNumber(state.music.xpEarned)}</Text><Text style={styles.summaryLabel}>XP obtenida</Text></View><View style={styles.summary}><Text style={styles.summaryValue}>+{formatNumber(state.music.pkcEarned)}</Text><Text style={styles.summaryLabel}>PKC obtenido</Text></View><View style={styles.summary}><Text style={styles.summaryValue}>+{formatNumber(state.music.musicalEvsEarned)}</Text><Text style={styles.summaryLabel}>EVs musicales</Text></View></View>{lastSync && <Text style={styles.syncNote}>Última sincronización: {new Date(lastSync).toLocaleTimeString()}</Text>}
    <View style={styles.info}><Text style={styles.infoTitle}>Limitaciones reales de Spotify</Text><Text style={styles.infoLine}>• Requiere permiso `user-read-currently-playing`.</Text><Text style={styles.infoLine}>• Puede responder 204 si no hay reproducción activa.</Text><Text style={styles.infoLine}>• Debemos respetar rate limits y no sincronizar/broadcast audio.</Text><Text style={styles.infoLine}>• En segundo plano, Android necesita servicio foreground nativo; la siguiente fase lo añade.</Text></View>
  </ScrollView>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: "#0d0b1b" }, content: { padding: 20, paddingTop: 18, paddingBottom: 32 }, eyebrow: { color: "#8f87b1", fontSize: 10, letterSpacing: 1.8, fontWeight: "800" }, title: { color: "#f7f4ff", fontSize: 26, lineHeight: 31, fontWeight: "900", marginTop: 7, maxWidth: 350 }, subtitle: { color: "#a9a3c8", fontSize: 12, lineHeight: 18, marginTop: 8, maxWidth: 360 }, nowCard: { marginTop: 22, backgroundColor: "#17132c", borderWidth: 1, borderColor: "#312b53", borderRadius: 22, padding: 18 }, nowHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, status: { flexDirection: "row", alignItems: "center", gap: 7 }, statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#817b9e" }, statusConnected: { backgroundColor: "#70e1bd" }, statusText: { color: "#a9a3c8", fontSize: 10, letterSpacing: 1, fontWeight: "800" }, track: { color: "#f7f4ff", fontSize: 24, fontWeight: "900", marginTop: 27 }, artist: { color: "#9b8cff", fontSize: 14, marginTop: 4, fontWeight: "700" }, album: { color: "#817b9e", fontSize: 11, marginTop: 3 }, wave: { flexDirection: "row", gap: 6, height: 42, alignItems: "center", marginTop: 14 }, bar: { flex: 1, backgroundColor: "#796be8", borderRadius: 4, opacity: 0.85 }, barPaused: { backgroundColor: "#817b9e", opacity: 0.45 }, progressRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 10 }, progressText: { color: "#817b9e", fontSize: 9, width: 30 }, progressTrack: { flex: 1, height: 5, backgroundColor: "#30294c", borderRadius: 4, overflow: "hidden" }, progressFill: { height: "100%", backgroundColor: "#70e1bd", borderRadius: 4 }, favorite: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#272144", borderRadius: 12, padding: 9, marginTop: 17 }, favoriteStar: { color: "#ffd477", fontSize: 17 }, favoriteText: { color: "#d6ceff", fontSize: 10, lineHeight: 14, flex: 1, fontWeight: "700" }, emptyPlayback: { color: "#817b9e", fontSize: 10, lineHeight: 15, marginTop: 14 }, buttonRow: { flexDirection: "row", gap: 9, marginTop: 12 }, connectButton: { flex: 1, backgroundColor: "#9b8cff", borderRadius: 14, padding: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 }, connectedButton: { backgroundColor: "#1c3e3b", borderWidth: 1, borderColor: "#2c6d61" }, connectLabel: { color: "#0d0b1b", fontWeight: "900", fontSize: 12 }, connectedLabel: { color: "#70e1bd" }, syncButton: { backgroundColor: "#28214b", borderRadius: 14, width: 48, alignItems: "center", justifyContent: "center" }, disconnectButton: { backgroundColor: "#17132c", borderWidth: 1, borderColor: "#312b53", borderRadius: 14, paddingHorizontal: 13, justifyContent: "center" }, disconnectText: { color: "#a9a3c8", fontSize: 11, fontWeight: "700" }, pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] }, redirectBanner: { marginTop: 14, backgroundColor: "#45302e", borderColor: "#84534d", borderWidth: 1, borderRadius: 14, padding: 12 }, configTitle: { color: "#ffd0a6", fontSize: 10, fontWeight: "900", letterSpacing: 0.8 }, configText: { color: "#f3c6ae", fontSize: 10, lineHeight: 15, marginTop: 5 }, redirectHint: { color: "#f3c6ae", fontSize: 9, lineHeight: 13, marginTop: 6 }, demoCard: { marginTop: 22, padding: 14, backgroundColor: "#211d38", borderRadius: 16, flexDirection: "row", gap: 11, borderWidth: 1, borderColor: "#38305d" }, demoIcon: { width: 33, height: 33, borderRadius: 10, backgroundColor: "#3b3152", alignItems: "center", justifyContent: "center" }, demoTitle: { color: "#f7f4ff", fontWeight: "800", fontSize: 13 }, demoText: { color: "#a9a3c8", fontSize: 11, lineHeight: 16, marginTop: 3 }, demoButtons: { flexDirection: "row", gap: 8, marginTop: 10 }, demoButton: { flex: 1, backgroundColor: "#17132c", borderWidth: 1, borderColor: "#312b53", paddingVertical: 12, borderRadius: 13, alignItems: "center" }, demoButtonTitle: { color: "#d6ceff", fontWeight: "900", fontSize: 13 }, demoButtonSub: { color: "#817b9e", fontSize: 9, marginTop: 3 }, sectionTitle: { color: "#f7f4ff", fontWeight: "900", fontSize: 16, marginTop: 25, marginBottom: 10 }, summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, summary: { width: "48%", backgroundColor: "#17132c", borderWidth: 1, borderColor: "#312b53", borderRadius: 15, padding: 13 }, summaryValue: { color: "#f7f4ff", fontSize: 19, fontWeight: "900" }, summaryLabel: { color: "#8f87b1", fontSize: 10, marginTop: 4 }, syncNote: { color: "#817b9e", fontSize: 10, marginTop: 12, textAlign: "center" }, info: { marginTop: 18, borderLeftWidth: 2, borderLeftColor: "#9b8cff", paddingLeft: 13, gap: 9 }, infoTitle: { color: "#d6ceff", fontWeight: "800", fontSize: 13, marginBottom: 2 }, infoLine: { color: "#a9a3c8", fontSize: 11, lineHeight: 16 },
});
