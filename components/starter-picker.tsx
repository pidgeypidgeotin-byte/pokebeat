import React from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { FIRST_151 } from "@/lib/pokedex";

export function StarterPicker({ visible, onChoose }: { visible: boolean; onChoose: (species: string) => void }) {
  const starters = [FIRST_151[0], FIRST_151[3], FIRST_151[6]];
  return <Modal visible={visible} transparent animationType="fade"><View style={styles.backdrop}><View style={styles.card}><Text style={styles.eyebrow}>PRIMERA AVENTURA</Text><Text style={styles.title}>Elige tu Pokémon inicial</Text><Text style={styles.subtitle}>Será tu compañero principal. Después podrás encontrar y capturar las demás especies en las 24 rutas de Kanto.</Text><View style={styles.row}>{starters.map((starter) => <Pressable key={starter.id} onPress={() => onChoose(starter.name)} style={({ pressed }) => [styles.option, pressed && styles.pressed]}><Image source={{ uri: starter.sprite }} style={styles.sprite} /><Text style={styles.name}>{starter.name}</Text><Text style={styles.pick}>Elegir</Text></Pressable>)}</View></View></View></Modal>;
}

const styles = StyleSheet.create({ backdrop: { flex: 1, backgroundColor: "rgba(5, 4, 13, 0.88)", justifyContent: "center", padding: 18 }, card: { backgroundColor: "#17132c", borderColor: "#4b3e80", borderWidth: 1, borderRadius: 24, padding: 18 }, eyebrow: { color: "#70e1bd", fontSize: 10, letterSpacing: 1.4, fontWeight: "900" }, title: { color: "#f7f4ff", fontSize: 24, fontWeight: "900", marginTop: 8 }, subtitle: { color: "#a9a3c8", fontSize: 12, lineHeight: 18, marginTop: 8 }, row: { flexDirection: "row", gap: 8, marginTop: 18 }, option: { flex: 1, backgroundColor: "#211d38", borderRadius: 16, alignItems: "center", padding: 9, borderWidth: 1, borderColor: "#38305d" }, sprite: { width: 76, height: 76 }, name: { color: "#f7f4ff", fontSize: 11, fontWeight: "900", marginTop: 4 }, pick: { color: "#70e1bd", fontSize: 10, fontWeight: "900", marginTop: 9 }, pressed: { opacity: 0.72, transform: [{ scale: 0.96 }] } });
