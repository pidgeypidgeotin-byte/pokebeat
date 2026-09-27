import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { FlatList, Image, StyleSheet, Text, View } from "react-native";

import { FIRST_151, type PokedexEntry } from "@/lib/pokedex";
import { useGame } from "@/lib/game-store";

function EntryCard({ item, captured }: { item: PokedexEntry; captured: boolean }) {
  const source = { uri: item.sprite };
  return <View style={styles.entry}><View style={styles.number}><Text style={styles.numberText}>#{String(item.id).padStart(3, "0")}</Text></View><Image source={source} style={styles.sprite} /><Text numberOfLines={1} style={styles.name}>{item.name}</Text><Ionicons name={captured ? "checkmark-circle" : "ellipse-outline"} size={13} color={captured ? "#70e1bd" : "#817b9e"} /></View>;
}

export default function PokedexScreen() {
  const { state } = useGame();
  return <View style={styles.screen}><FlatList data={FIRST_151} keyExtractor={(item) => String(item.id)} numColumns={2} columnWrapperStyle={styles.row} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} ListHeaderComponent={<View><Text style={styles.eyebrow}>POKÉDEX / KANTO</Text><Text style={styles.title}>Los primeros 151</Text><Text style={styles.subtitle}>Explora la Pokédex original de Kanto. Hay 101 sprites PMD locales y fallback visual para las especies que todavía no están publicadas en SpriteCollab.</Text><View style={styles.progress}><Text style={styles.progressText}>151 especies disponibles</Text><Text style={styles.progressValue}>{state.collection.length} / 151 capturadas</Text></View></View>} renderItem={({ item }) => <EntryCard item={item} captured={state.collection.includes(item.id)} />}/></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0d0b1b" },
  content: { padding: 16, paddingTop: 18, paddingBottom: 32 },
  eyebrow: { color: "#8f87b1", fontSize: 10, letterSpacing: 1.8, fontWeight: "800" },
  title: { color: "#f7f4ff", fontSize: 27, fontWeight: "900", marginTop: 7 },
  subtitle: { color: "#a9a3c8", fontSize: 12, lineHeight: 18, marginTop: 8, marginBottom: 17 },
  progress: { backgroundColor: "#17132c", borderRadius: 14, borderWidth: 1, borderColor: "#312b53", padding: 12, flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  progressText: { color: "#d6ceff", fontSize: 11, fontWeight: "800" },
  progressValue: { color: "#70e1bd", fontSize: 10, fontWeight: "800" },
  row: { gap: 9, marginBottom: 9 },
  entry: { flex: 1, backgroundColor: "#17132c", borderRadius: 16, borderWidth: 1, borderColor: "#312b53", padding: 10, minHeight: 166, alignItems: "center" },
  number: { width: "100%", alignItems: "flex-start" },
  numberText: { color: "#817b9e", fontSize: 10, fontWeight: "800" },
  sprite: { width: 100, height: 100, marginTop: 2 },
  name: { color: "#f7f4ff", fontSize: 12, fontWeight: "900", maxWidth: 125, marginTop: 2, marginBottom: 4 },
});
