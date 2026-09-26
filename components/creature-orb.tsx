import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import type { Mood } from "@/lib/game-store";

export function CreatureOrb({ mood, shiny, onPress }: { mood: Mood; shiny: boolean; onPress: () => void }) {
  const float = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: -7, duration: 1200, useNativeDriver: true }),
      Animated.timing(float, { toValue: 0, duration: 1200, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [float]);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.touchTarget, pressed && styles.pressed]} accessibilityLabel="Tocar a Lumi">
      <Animated.View style={[styles.orbWrap, { transform: [{ translateY: float }] }]}>
        <View style={styles.aura} />
        <View style={styles.earLeft} />
        <View style={styles.earRight} />
        <View style={[styles.body, shiny && styles.shinyBody]}>
          <View style={styles.face}>
            <View style={styles.eyeRow}><Text style={styles.eye}>•</Text><Text style={styles.eye}>•</Text></View>
            <Text style={styles.mouth}>{mood === "Cansado" ? "﹀" : mood === "Emocionado" ? "◡" : "⌣"}</Text>
          </View>
          <View style={styles.belly}><Text style={styles.spark}>✦</Text></View>
        </View>
        {shiny && <Text style={styles.shinyBadge}>✦</Text>}
      </Animated.View>
      <Text style={styles.tapHint}>Tócame para interactuar</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touchTarget: { alignItems: "center", paddingVertical: 8 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  orbWrap: { width: 210, height: 210, alignItems: "center", justifyContent: "center" },
  aura: { position: "absolute", width: 190, height: 190, borderRadius: 95, backgroundColor: "rgba(129, 110, 255, 0.18)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  body: { width: 132, height: 132, borderRadius: 68, backgroundColor: "#8b7cff", borderWidth: 5, borderColor: "#bfb7ff", shadowColor: "#8b7cff", shadowOpacity: 0.5, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 9 },
  shinyBody: { backgroundColor: "#53c8bf", borderColor: "#e7ffb3", shadowColor: "#e7ffb3" },
  earLeft: { position: "absolute", left: 38, top: 29, width: 45, height: 56, borderRadius: 28, backgroundColor: "#7062df", transform: [{ rotate: "-28deg" }] },
  earRight: { position: "absolute", right: 38, top: 29, width: 45, height: 56, borderRadius: 28, backgroundColor: "#7062df", transform: [{ rotate: "28deg" }] },
  face: { alignItems: "center", paddingTop: 32 },
  eyeRow: { flexDirection: "row", gap: 42 },
  eye: { color: "#17142b", fontSize: 32, lineHeight: 34, fontWeight: "900" },
  mouth: { color: "#17142b", fontSize: 27, lineHeight: 30, marginTop: 3 },
  belly: { width: 54, height: 35, borderRadius: 25, backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center", alignSelf: "center", marginTop: 8 },
  spark: { color: "#fff4b5", fontSize: 22 },
  shinyBadge: { position: "absolute", right: 27, top: 34, color: "#f7ffad", fontSize: 26 },
  tapHint: { color: "#a9a3c8", fontSize: 12, marginTop: 0 },
});
