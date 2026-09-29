import React, { useEffect, useState } from "react";
import { Alert, AppState, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { getPetOverlay } from "pokebeat-pet-overlay";
import { useGame } from "@/lib/game-store";
import { getPokedexEntry } from "@/lib/pokedex";
import { getValidAccessToken } from "@/lib/spotify";

export function PetOverlayControl() {
  const { state } = useGame();
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    try {
      const native = getPetOverlay();
      setAvailable(true);
      setHasPermission(native.canDrawOverlays());
      const subscription = AppState.addEventListener("change", (nextState) => {
        if (nextState === "active") setHasPermission(native.canDrawOverlays());
      });
      return () => subscription.remove();
    } catch {
      setAvailable(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled || Platform.OS !== "android") return;
    void getValidAccessToken().then((token) => { try { getPetOverlay().start(getPokedexEntry(state.creature.species).id, token ?? ""); } catch { /* runtime native module unavailable */ } });
  }, [enabled, state.creature.species, state.music.connected]);

  if (Platform.OS !== "android") return null;
  if (!available) return <View style={styles.card}><Text style={styles.title}>Mascota persistente</Text><Text style={styles.body}>Disponible en la compilación Android nativa.</Text></View>;

  const toggle = async () => {
    const native = getPetOverlay();
    if (!hasPermission) {
      native.openOverlaySettings();
      Alert.alert("Permiso requerido", "Activa “Mostrar sobre otras aplicaciones” para que tu Pokémon pueda acompañarte fuera de PokéBeat. Después vuelve aquí y pulsa de nuevo.");
      return;
    }
    if (enabled) { native.stop(); setEnabled(false); } else { const token = await getValidAccessToken(); native.start(getPokedexEntry(state.creature.species).id, token ?? ""); setEnabled(true); }
  };

  return <View style={styles.card}><View style={styles.row}><View style={{ flex: 1 }}><Text style={styles.title}>Mascota persistente</Text><Text style={styles.body}>{enabled ? `${state.creature.species} está visible sobre otras apps.` : hasPermission ? "Permiso listo: puedes activar el overlay." : "Activa el permiso de overlay para usarlo."}</Text></View><Text style={styles.icon}>◉</Text></View><Pressable onPress={toggle} style={({ pressed }) => [styles.button, enabled && styles.stopButton, pressed && styles.pressed]}><Text style={[styles.buttonText, enabled && styles.stopText]}>{enabled ? "Ocultar mascota" : hasPermission ? "Mostrar fuera de la app" : "Conceder permiso"}</Text></Pressable><Text style={styles.note}>Android mantiene una notificación foreground mientras está activo; puedes detenerlo desde aquí o desde el sistema.</Text></View>;
}

const styles = StyleSheet.create({ card: { marginTop: 16, backgroundColor: "#211d38", borderWidth: 1, borderColor: "#38305d", borderRadius: 16, padding: 14 }, row: { flexDirection: "row", alignItems: "center" }, title: { color: "#f7f4ff", fontSize: 13, fontWeight: "900" }, body: { color: "#a9a3c8", fontSize: 10, lineHeight: 15, marginTop: 4 }, icon: { color: "#70e1bd", fontSize: 26, marginLeft: 10 }, button: { backgroundColor: "#9b8cff", borderRadius: 12, paddingVertical: 11, alignItems: "center", marginTop: 12 }, stopButton: { backgroundColor: "#28214b", borderWidth: 1, borderColor: "#514583" }, buttonText: { color: "#16122d", fontWeight: "900", fontSize: 11 }, stopText: { color: "#d6ceff" }, note: { color: "#817b9e", fontSize: 9, lineHeight: 13, marginTop: 9 }, pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
});
