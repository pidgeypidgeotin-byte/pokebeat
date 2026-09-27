import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { CreatureOrb } from "@/components/creature-orb";
import { PetOverlayControl } from "@/components/pet-overlay-control";
import { StarterPicker } from "@/components/starter-picker";
import { formatNumber, xpForNextLevel } from "@/lib/game-config";
import { useGame } from "@/lib/game-store";

function ActionButton({ icon, label, onPress, tone = "default" }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; tone?: "default" | "primary" }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.actionButton, tone === "primary" && styles.actionPrimary, pressed && styles.pressed]}><Ionicons name={icon} size={18} color={tone === "primary" ? "#16122d" : "#d6ceff"} /><Text style={[styles.actionLabel, tone === "primary" && styles.actionLabelPrimary]}>{label}</Text></Pressable>;
}

export default function HomeScreen() {
  const router = useRouter();
  const { state, isHydrated, tapCreature, feedCreature, chooseStarter } = useGame();
  const nextXp = xpForNextLevel(state.creature.level);
  const xpProgress = Math.min(1, state.creature.xp / Math.max(1, nextXp));
  const charmActive = Boolean(state.creature.shinyCharmUntil && state.creature.shinyCharmUntil > Date.now());

  return (
    <>
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View><Text style={styles.eyebrow}>POKÉBEAT / REFUGIO</Text><Text style={styles.title}>Tu ritmo, su historia</Text></View>
        <View style={styles.wallet}><View style={styles.walletRow}><Text style={styles.coin}>●</Text><Text style={styles.walletText}>{formatNumber(state.wallet.pkc)}</Text></View><View style={styles.walletRow}><Text style={styles.diamond}>◆</Text><Text style={styles.walletText}>{formatNumber(state.wallet.pkd)}</Text></View></View>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroTop}><View><Text style={styles.species}>{state.creature.species}</Text><Text style={styles.level}>Nivel {formatNumber(state.creature.level)}</Text></View><View style={styles.moodPill}><Text style={styles.moodDot}>●</Text><Text style={styles.moodText}>{state.creature.mood}</Text></View></View>
        <CreatureOrb species={state.creature.species} mood={state.creature.mood} shiny={state.creature.shiny} onPress={tapCreature} />
        <View style={styles.dialogue}><Text style={styles.dialogueMark}>“</Text><Text style={styles.dialogueText}>{state.dialogue}</Text></View>
        <View style={styles.xpRow}><Text style={styles.xpLabel}>XP de aventura</Text><Text style={styles.xpNumber}>{formatNumber(state.creature.xp)} / {formatNumber(nextXp)}</Text></View>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(3, xpProgress * 100)}%` }]} /></View>
        <View style={styles.songRow}><View style={styles.songIcon}><Ionicons name="musical-notes" size={17} color="#d6ceff" /></View><View style={{ flex: 1 }}><Text style={styles.songLabel}>SONANDO AHORA</Text><Text style={styles.songTitle}>{state.music.currentTrack}</Text><Text style={styles.songArtist}>{state.music.currentArtist} {state.music.currentArtist === state.creature.favoriteArtist ? "· ★ favorito" : ""}</Text></View><Text style={styles.playing}>●</Text></View>
      </View>

      <View style={styles.actions}><ActionButton icon="hand-left-outline" label="Interactuar" onPress={tapCreature} /><ActionButton icon="restaurant-outline" label="Dar baya" onPress={feedCreature} /><ActionButton icon="musical-notes-outline" label="Escuchar" onPress={() => router.push("/(tabs)/music")} tone="primary" /></View>
      <Pressable onPress={() => router.push("/(tabs)/music")} style={({ pressed }) => [styles.spotifyBanner, pressed && styles.pressed]}><View style={styles.spotifyIcon}><Ionicons name="musical-notes" size={22} color="#0d0b1b" /></View><View style={{ flex: 1 }}><Text style={styles.spotifyTitle}>{state.music.connected ? "Spotify vinculado" : "Vincula Spotify"}</Text><Text style={styles.spotifyText}>{state.music.connected ? `Cuenta: ${state.music.accountName ?? "conectada"}` : "La música real hace crecer a tu Pokémon"}</Text></View><Ionicons name="chevron-forward" size={20} color="#70e1bd" /></Pressable>
      <PetOverlayControl />

      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Pulso de hoy</Text><Text style={styles.sectionMeta}>{state.music.minutesListened} min acumulados</Text></View>
      <View style={styles.statsGrid}><View style={styles.statCard}><Text style={styles.statIcon}>♫</Text><Text style={styles.statValue}>+{formatNumber(state.music.xpEarned)}</Text><Text style={styles.statCaption}>XP musical total</Text></View><View style={styles.statCard}><Text style={styles.statIcon}>✦</Text><Text style={styles.statValue}>+{formatNumber(state.music.musicalEvsEarned)}</Text><Text style={styles.statCaption}>EVs musicales</Text></View></View>

      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Atajos</Text><Text style={styles.sectionMeta}>sigue creciendo</Text></View>
      <View style={styles.shortcutRow}><Pressable onPress={() => router.push("/(tabs)/collection")} style={({ pressed }) => [styles.shortcut, pressed && styles.pressed]}><Text style={styles.shortcutIcon}>◈</Text><Text style={styles.shortcutTitle}>Ficha</Text><Text style={styles.shortcutSub}>IVs y EVs</Text></Pressable><Pressable onPress={() => router.push("/(tabs)/quests")} style={({ pressed }) => [styles.shortcut, pressed && styles.pressed]}><Text style={styles.shortcutIcon}>⚑</Text><Text style={styles.shortcutTitle}>Misiones</Text><Text style={styles.shortcutSub}>recompensas</Text></Pressable><Pressable onPress={() => router.push("/(tabs)/play")} style={({ pressed }) => [styles.shortcut, pressed && styles.pressed]}><Text style={styles.shortcutIcon}>⌁</Text><Text style={styles.shortcutTitle}>Rutas</Text><Text style={styles.shortcutSub}>encuentros</Text></Pressable></View>
      {charmActive && <View style={styles.charmBanner}><Text style={styles.charmIcon}>✧</Text><Text style={styles.charmText}>Shiny Charm activo · aumenta tus probabilidades</Text></View>}
    </ScrollView>
    <StarterPicker visible={isHydrated && !state.starterChosen} onChoose={(species) => { chooseStarter(species); }} />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0d0b1b" }, content: { padding: 20, paddingTop: 18, paddingBottom: 32 }, header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }, eyebrow: { color: "#8f87b1", fontSize: 10, letterSpacing: 1.8, fontWeight: "800" }, title: { color: "#f7f4ff", fontSize: 24, fontWeight: "800", marginTop: 5 }, wallet: { gap: 7, alignItems: "flex-end" }, walletRow: { flexDirection: "row", alignItems: "center", gap: 7 }, coin: { color: "#ffd477", fontSize: 13 }, diamond: { color: "#72e0c0", fontSize: 13 }, walletText: { color: "#f7f4ff", fontWeight: "800", fontSize: 13 }, heroCard: { backgroundColor: "#17132c", borderRadius: 26, borderWidth: 1, borderColor: "#312b53", padding: 18, overflow: "hidden" }, heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, species: { color: "#f7f4ff", fontSize: 18, fontWeight: "800" }, level: { color: "#a9a3c8", marginTop: 2, fontSize: 12 }, moodPill: { backgroundColor: "#242044", paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20, flexDirection: "row", alignItems: "center", gap: 6 }, moodDot: { color: "#70e1bd", fontSize: 11 }, moodText: { color: "#d6ceff", fontSize: 12, fontWeight: "700" }, dialogue: { flexDirection: "row", backgroundColor: "#201b3c", borderRadius: 14, padding: 11, marginTop: 3 }, dialogueMark: { color: "#9b8cff", fontSize: 25, lineHeight: 21, marginRight: 5 }, dialogueText: { color: "#e7e1ff", fontSize: 13, lineHeight: 19, flex: 1 }, xpRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 17, marginBottom: 7 }, xpLabel: { color: "#a9a3c8", fontSize: 11, fontWeight: "700" }, xpNumber: { color: "#d6ceff", fontSize: 11, fontWeight: "800" }, progressTrack: { height: 7, borderRadius: 5, backgroundColor: "#30294c", overflow: "hidden" }, progressFill: { height: "100%", borderRadius: 5, backgroundColor: "#9b8cff" }, songRow: { flexDirection: "row", alignItems: "center", gap: 11, paddingTop: 16, marginTop: 14, borderTopColor: "#312b53", borderTopWidth: 1 }, songIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: "#2b2450", alignItems: "center", justifyContent: "center" }, songLabel: { color: "#807a9d", fontSize: 9, letterSpacing: 1.2, fontWeight: "800" }, songTitle: { color: "#f7f4ff", fontSize: 13, fontWeight: "800", marginTop: 2 }, songArtist: { color: "#a9a3c8", fontSize: 11, marginTop: 2 }, playing: { color: "#70e1bd", fontSize: 13 }, spotifyBanner: { marginTop: 13, backgroundColor: "#193c35", borderRadius: 16, padding: 13, flexDirection: "row", alignItems: "center", gap: 11, borderWidth: 1, borderColor: "#2c6d61" }, spotifyIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#70e1bd", alignItems: "center", justifyContent: "center" }, spotifyTitle: { color: "#e5fff7", fontSize: 13, fontWeight: "900" }, spotifyText: { color: "#a9e7d5", fontSize: 10, marginTop: 3 }, actions: { flexDirection: "row", gap: 8, marginTop: 13 }, actionButton: { flex: 1, backgroundColor: "#17132c", borderWidth: 1, borderColor: "#312b53", borderRadius: 14, paddingVertical: 12, alignItems: "center", justifyContent: "center", gap: 5 }, actionPrimary: { backgroundColor: "#9b8cff", borderColor: "#9b8cff" }, actionLabel: { color: "#d6ceff", fontWeight: "800", fontSize: 10 }, actionLabelPrimary: { color: "#16122d" }, pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] }, sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginTop: 24, marginBottom: 10 }, sectionTitle: { color: "#f7f4ff", fontSize: 16, fontWeight: "800" }, sectionMeta: { color: "#817b9e", fontSize: 11 }, statsGrid: { flexDirection: "row", gap: 10 }, statCard: { flex: 1, backgroundColor: "#17132c", borderWidth: 1, borderColor: "#312b53", borderRadius: 16, padding: 14 }, statIcon: { color: "#9b8cff", fontSize: 19 }, statValue: { color: "#f7f4ff", fontSize: 21, fontWeight: "900", marginTop: 8 }, statCaption: { color: "#a9a3c8", fontSize: 11, marginTop: 3 }, shortcutRow: { flexDirection: "row", gap: 9 }, shortcut: { flex: 1, backgroundColor: "#17132c", borderRadius: 16, borderWidth: 1, borderColor: "#312b53", padding: 12, minHeight: 96 }, shortcutIcon: { color: "#70e1bd", fontSize: 20 }, shortcutTitle: { color: "#f7f4ff", fontSize: 12, fontWeight: "800", marginTop: 9 }, shortcutSub: { color: "#8f87b1", fontSize: 10, marginTop: 2 }, charmBanner: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "#243c42", borderRadius: 14, padding: 12, marginTop: 14 }, charmIcon: { color: "#e7ffb3", fontSize: 20 }, charmText: { color: "#b8e8d6", fontSize: 11, fontWeight: "700", flex: 1 },
});
