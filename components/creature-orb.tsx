import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { Mood } from "@/lib/game-store";

export function CreatureOrb({ mood, shiny, onPress }: { mood: Mood; shiny: boolean; onPress: () => void }) {
  const float = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const animation = Animated.loop(Animated.parallel([
      Animated.sequence([
        Animated.timing(float, { toValue: -9, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.045, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ]));
    animation.start();
    const spriteTimer = setInterval(() => setFrame((current) => (current + 1) % 6), 180);
    return () => { animation.stop(); clearInterval(spriteTimer); };
  }, [float, pulse]);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.touchTarget, pressed && styles.pressed]} accessibilityLabel="Tocar a Lumi">
      <Animated.View style={[styles.orbWrap, { transform: [{ translateY: float }, { scale: pulse }] }]}>
        <View style={styles.aura} />
        <View style={[styles.body, shiny && styles.shinyBody]}>
          <View style={styles.spriteFrame}>
            <Image source={require("@/assets/sprites/pikachu-idle.png")} style={[styles.spriteSheet, { left: -118 * frame }]} resizeMode="stretch" />
          </View>
          <View style={styles.moodBadge}><Text style={styles.moodFace}>{mood === "Cansado" ? "﹀" : mood === "Emocionado" ? "!" : "♪"}</Text></View>
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
  spriteFrame: { width: 118, height: 118, overflow: "hidden", alignItems: "flex-start", justifyContent: "flex-start", position: "relative" },
  spriteSheet: { position: "absolute", width: 708, height: 1316, top: 0 },
  moodBadge: { position: "absolute", right: -3, top: 19, width: 32, height: 32, borderRadius: 16, backgroundColor: "#fff0a4", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#17142b" },
  moodFace: { color: "#17142b", fontSize: 18, fontWeight: "900" },
  shinyBadge: { position: "absolute", right: 27, top: 34, color: "#f7ffad", fontSize: 26 },
  tapHint: { color: "#a9a3c8", fontSize: 12, marginTop: 0 },
});
