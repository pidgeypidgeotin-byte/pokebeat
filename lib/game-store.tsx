import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { DIALOGUES, GAME_CONFIG, type StatKey } from "@/lib/game-config";

export type Mood = "Feliz" | "Emocionado" | "Cansado" | "Curioso" | "Hambriento" | "Relajado";

type Stats = Record<StatKey, number>;
type Ivs = Record<StatKey, number>;
type Inventory = Record<string, number>;

export type Mission = {
  id: string;
  cadence: "Diarias" | "Semanales" | "Mensuales";
  title: string;
  description: string;
  progress: number;
  goal: number;
  reward: { pkc?: number; pkd?: number; item?: string };
  claimed: boolean;
};

export type GameState = {
  creature: {
    name: string;
    species: string;
    level: number;
    xp: number;
    mood: Mood;
    nature: string;
    favoriteArtist: string;
    favoriteSong: string;
    shiny: boolean;
    musicalEvs: Stats;
    normalEvs: Stats;
    ivs: Ivs;
    shinyCharmUntil: number | null;
  };
  wallet: { pkc: number; pkd: number };
  inventory: Inventory;
  music: {
    connected: boolean;
    accountName: string | null;
    currentTrack: string;
    currentArtist: string;
    minutesListened: number;
    xpEarned: number;
    pkcEarned: number;
    musicalEvsEarned: number;
  };
  missions: Mission[];
  dialogue: string;
  notifications: string[];
  lastSavedAt: number;
};

const zeroStats = (): Stats => ({ hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 });
const baseIvs = (): Ivs => ({ hp: 27, attack: 31, defense: 18, specialAttack: 24, specialDefense: 29, speed: 22 });

export const initialGameState: GameState = {
  creature: {
    name: "Lumi",
    species: "Lumi",
    level: 18,
    xp: 2120,
    mood: "Feliz",
    nature: "Serena",
    favoriteArtist: "Mara Sol",
    favoriteSong: "Neon Sunrise",
    shiny: false,
    musicalEvs: zeroStats(),
    normalEvs: { hp: 80, attack: 132, defense: 44, specialAttack: 16, specialDefense: 28, speed: 64 },
    ivs: baseIvs(),
    shinyCharmUntil: null,
  },
  wallet: { pkc: 25420, pkd: 48 },
  inventory: { "Poké Ball": 12, "Baya energética": 4, "Accesorio aurora": 1, "Shiny Charm": 0 },
  music: {
    connected: false,
    accountName: null,
    currentTrack: "Neon Sunrise",
    currentArtist: "Mara Sol",
    minutesListened: 272,
    xpEarned: 12450,
    pkcEarned: 2400,
    musicalEvsEarned: 7,
  },
  missions: [
    { id: "daily-listen", cadence: "Diarias", title: "Ritmo diario", description: "Escucha 30 minutos de música", progress: 18, goal: 30, reward: { pkc: 250 }, claimed: false },
    { id: "daily-train", cadence: "Diarias", title: "Pequeño entrenamiento", description: "Entrena una estadística normal", progress: 0, goal: 1, reward: { pkc: 180 }, claimed: false },
    { id: "weekly-xp", cadence: "Semanales", title: "Sesión larga", description: "Consigue 2.000 XP musical", progress: 1240, goal: 2000, reward: { pkc: 900, pkd: 2 }, claimed: false },
    { id: "monthly-breed", cadence: "Mensuales", title: "Nueva generación", description: "Incuba un huevo", progress: 0, goal: 1, reward: { pkd: 8, item: "Poké Ball" }, claimed: false },
  ],
  dialogue: "¡Hola! ¿Qué escuchamos hoy?",
  notifications: ["Lumi está listo para escuchar música.", "Artista favorito detectado: Mara Sol."],
  lastSavedAt: Date.now(),
};

const STORAGE_KEY = "pokebeat-save-v1";

type GameContextValue = {
  state: GameState;
  isHydrated: boolean;
  tapCreature: () => void;
  feedCreature: () => void;
  trainStat: (stat: StatKey) => { ok: boolean; message: string };
  awardListeningMinutes: (minutes: number) => void;
  setSpotifySession: (connected: boolean, accountName?: string | null) => void;
  claimMission: (id: string) => { ok: boolean; message: string };
  buyShinyCharm: () => { ok: boolean; message: string };
};

const GameContext = createContext<GameContextValue | null>(null);

function pushNotification(notifications: string[], message: string) {
  return [message, ...notifications.filter((item) => item !== message)].slice(0, 8);
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(initialGameState);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          try {
            setState({ ...initialGameState, ...JSON.parse(stored) });
          } catch {
            setState(initialGameState);
          }
        }
      })
      .finally(() => setIsHydrated(true));
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, lastSavedAt: Date.now() })).catch(() => undefined);
  }, [isHydrated, state]);

  const tapCreature = useCallback(() => {
    setState((current) => ({
      ...current,
      creature: { ...current.creature, mood: "Curioso" },
      dialogue: DIALOGUES[Math.floor(Math.random() * DIALOGUES.length)],
      notifications: pushNotification(current.notifications, "Lumi reaccionó a tu toque."),
    }));
  }, []);

  const feedCreature = useCallback(() => {
    setState((current) => ({
      ...current,
      creature: { ...current.creature, mood: "Feliz" },
      inventory: { ...current.inventory, "Baya energética": Math.max(0, (current.inventory["Baya energética"] ?? 0) - 1) },
      dialogue: "¡Ñam! Gracias por cuidarme.",
      notifications: pushNotification(current.notifications, "Lumi recuperó el ánimo."),
    }));
  }, []);

  const trainStat = useCallback((stat: StatKey) => {
    let result = { ok: false, message: "No se pudo entrenar." };
    setState((current) => {
      const totalNormal = Object.values(current.creature.normalEvs).reduce((sum, value) => sum + value, 0);
      if (current.wallet.pkc < GAME_CONFIG.normalEvTrainingCost) {
        result = { ok: false, message: "Necesitas más PKC para entrenar." };
        return current;
      }
      if (totalNormal >= 512 || current.creature.normalEvs[stat] >= 252) {
        result = { ok: false, message: "El límite de EV normal ya fue alcanzado." };
        return current;
      }
      const nextEvs = { ...current.creature.normalEvs, [stat]: Math.min(252, current.creature.normalEvs[stat] + GAME_CONFIG.normalEvPerTraining) };
      const nextXp = current.creature.xp + GAME_CONFIG.xpPerTraining;
      result = { ok: true, message: `Entrenamiento completado: +${GAME_CONFIG.normalEvPerTraining} EV ${stat.toUpperCase()}.` };
      return {
        ...current,
        wallet: { ...current.wallet, pkc: current.wallet.pkc - GAME_CONFIG.normalEvTrainingCost },
        creature: { ...current.creature, normalEvs: nextEvs, xp: nextXp, mood: "Emocionado" },
        missions: current.missions.map((mission) => mission.id === "daily-train" ? { ...mission, progress: Math.min(mission.goal, mission.progress + 1) } : mission),
        dialogue: "¡Eso fue intenso! Me siento más fuerte.",
        notifications: pushNotification(current.notifications, result.message),
      };
    });
    return result;
  }, []);

  const awardListeningMinutes = useCallback((minutes: number) => {
    if (minutes <= 0) return;
    setState((current) => {
      const isFavorite = current.music.currentArtist.toLowerCase() === current.creature.favoriteArtist.toLowerCase();
      const multiplier = isFavorite ? GAME_CONFIG.favoriteArtistXpMultiplier : 1;
      const earnedXp = Math.floor(minutes * GAME_CONFIG.xpPerMinute * multiplier);
      const earnedPkc = Math.floor(minutes * GAME_CONFIG.pkcPerMinute);
      const nextMusicEvs = { ...current.creature.musicalEvs };
      let earnedMusicEv = 0;
      const chance = Math.min(0.95, (minutes / 10) * GAME_CONFIG.musicEvChancePerTenMinutes * (isFavorite ? GAME_CONFIG.favoriteArtistMusicEvMultiplier : 1));
      if (minutes >= GAME_CONFIG.musicEvMinimumMinutes && Math.random() < chance) {
        const keys = Object.keys(nextMusicEvs) as StatKey[];
        const randomStat = keys[Math.floor(Math.random() * keys.length)];
        earnedMusicEv = GAME_CONFIG.musicEvAmountMin + Math.floor(Math.random() * (GAME_CONFIG.musicEvAmountMax - GAME_CONFIG.musicEvAmountMin + 1));
        nextMusicEvs[randomStat] += earnedMusicEv;
      }
      let nextLevel = current.creature.level;
      let nextXp = current.creature.xp + earnedXp;
      let levelUp = false;
      while (nextXp >= Math.floor(GAME_CONFIG.levelBaseXp + nextLevel * GAME_CONFIG.levelLinearGrowth + Math.pow(nextLevel, 1.22) * GAME_CONFIG.levelCurveGrowth)) {
        nextXp -= Math.floor(GAME_CONFIG.levelBaseXp + nextLevel * GAME_CONFIG.levelLinearGrowth + Math.pow(nextLevel, 1.22) * GAME_CONFIG.levelCurveGrowth);
        nextLevel += 1;
        levelUp = true;
      }
      const nextNotifications = earnedMusicEv > 0
        ? pushNotification(current.notifications, `¡EV musical obtenido! +${earnedMusicEv} en ${Object.entries(nextMusicEvs).find(([, value], index) => value !== Object.values(current.creature.musicalEvs)[index])?.[0]?.toUpperCase() ?? "una estadística"}.`)
        : current.notifications;
      const levelMessage = levelUp ? `¡Lumi subió al nivel ${nextLevel}!` : null;
      return {
        ...current,
        creature: { ...current.creature, xp: nextXp, level: nextLevel, musicalEvs: nextMusicEvs, mood: isFavorite ? "Emocionado" : "Relajado" },
        wallet: { ...current.wallet, pkc: current.wallet.pkc + earnedPkc },
        music: { ...current.music, minutesListened: current.music.minutesListened + minutes, xpEarned: current.music.xpEarned + earnedXp, pkcEarned: current.music.pkcEarned + earnedPkc, musicalEvsEarned: current.music.musicalEvsEarned + earnedMusicEv },
        missions: current.missions.map((mission) => {
          if (mission.id === "daily-listen") return { ...mission, progress: Math.min(mission.goal, mission.progress + minutes) };
          if (mission.id === "weekly-xp") return { ...mission, progress: Math.min(mission.goal, mission.progress + earnedXp) };
          return mission;
        }),
        dialogue: levelMessage ?? (isFavorite ? "¡Mi artista favorito! ¡Esta canción es perfecta!" : "La música me hace sentir bien."),
        notifications: levelMessage ? pushNotification(nextNotifications, levelMessage) : nextNotifications,
      };
    });
  }, []);

  const setSpotifySession = useCallback((connected: boolean, accountName: string | null = null) => {
    setState((current) => ({
      ...current,
      music: { ...current.music, connected, accountName },
      dialogue: connected ? "¡Spotify conectado! Pon una canción y creceremos juntos." : "Spotify desconectado por ahora.",
      notifications: pushNotification(current.notifications, connected ? "Spotify conectado correctamente." : "Spotify desconectado."),
    }));
  }, []);

  const claimMission = useCallback((id: string) => {
    let result = { ok: false, message: "Misión no disponible." };
    setState((current) => {
      const mission = current.missions.find((item) => item.id === id);
      if (!mission || mission.claimed || mission.progress < mission.goal) return current;
      const nextWallet = { ...current.wallet, pkc: current.wallet.pkc + (mission.reward.pkc ?? 0), pkd: current.wallet.pkd + (mission.reward.pkd ?? 0) };
      const nextInventory = mission.reward.item ? { ...current.inventory, [mission.reward.item]: (current.inventory[mission.reward.item] ?? 0) + 1 } : current.inventory;
      result = { ok: true, message: `Recompensa reclamada: ${mission.reward.pkc ? `+${mission.reward.pkc} PKC ` : ""}${mission.reward.pkd ? `+${mission.reward.pkd} PKD` : ""}`.trim() };
      return { ...current, wallet: nextWallet, inventory: nextInventory, missions: current.missions.map((item) => item.id === id ? { ...item, claimed: true } : item), notifications: pushNotification(current.notifications, result.message), dialogue: "¡Misión completada!" };
    });
    return result;
  }, []);

  const buyShinyCharm = useCallback(() => {
    let result = { ok: false, message: "No se pudo comprar el amuleto." };
    setState((current) => {
      if (current.wallet.pkd < GAME_CONFIG.shinyCharmCostPkd) {
        result = { ok: false, message: `Necesitas ${GAME_CONFIG.shinyCharmCostPkd} PKD.` };
        return current;
      }
      const until = Date.now() + GAME_CONFIG.shinyCharmDays * 24 * 60 * 60 * 1000;
      result = { ok: true, message: `Shiny Charm activo durante ${GAME_CONFIG.shinyCharmDays} días.` };
      return { ...current, wallet: { ...current.wallet, pkd: current.wallet.pkd - GAME_CONFIG.shinyCharmCostPkd }, creature: { ...current.creature, shinyCharmUntil: until }, inventory: { ...current.inventory, "Shiny Charm": (current.inventory["Shiny Charm"] ?? 0) + 1 }, notifications: pushNotification(current.notifications, result.message) };
    });
    return result;
  }, []);

  const value = useMemo(() => ({ state, isHydrated, tapCreature, feedCreature, trainStat, awardListeningMinutes, setSpotifySession, claimMission, buyShinyCharm }), [state, isHydrated, tapCreature, feedCreature, trainStat, awardListeningMinutes, setSpotifySession, claimMission, buyShinyCharm]);
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame debe usarse dentro de GameProvider");
  return context;
}
