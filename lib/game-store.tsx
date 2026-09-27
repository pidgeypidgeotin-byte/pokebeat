import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { DIALOGUES, GAME_CONFIG, safeListeningMinutes, type StatKey } from "@/lib/game-config";
import { getPokedexEntry } from "@/lib/pokedex";
import { routeFor } from "@/lib/routes";
import { KANTO_GYMS, nextGym, unlockedRouteCount } from "@/lib/gyms";

export type Mood = "Feliz" | "Triste" | "Enojado" | "Emocionado" | "Cansado" | "Dormido" | "Aburrido" | "Curioso" | "Hambriento" | "Alegre" | "Nervioso" | "Relajado";
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

type BreedingState = {
  active: boolean;
  parentA: string;
  parentB: string;
  compatibility: number;
  minutes: number;
  goal: number;
  masuda: boolean;
};

type AntiAbuseState = { dayKey: string; acceptedMinutesToday: number; lastAcceptedAt: number | null };

export type GameState = {
  creature: {
    name: string;
    species: string;
    evolutionStage: string;
    level: number;
    xp: number;
    mood: Mood;
    hunger: number;
    energy: number;
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
  customization: { ball: string; skin: string; accessory: string };
  music: {
    connected: boolean;
    accountName: string | null;
    currentTrack: string;
    currentArtist: string;
    currentAlbum: string;
    minutesListened: number;
    xpEarned: number;
    pkcEarned: number;
    musicalEvsEarned: number;
  };
  antiAbuse: AntiAbuseState;
  breeding: BreedingState;
  missions: Mission[];
  activeEvent: { id: string; title: string; multiplier: number; endsAt: number } | null;
  lastBattle: { opponent: string; result: "victoria" | "derrota"; reward: number } | null;
  dialogue: string;
  notifications: string[];
  lastSavedAt: number;
  starterChosen: boolean;
  collection: number[];
  route: { current: number; encounter: { id: number; level: number; weakened?: boolean } | null };
  gymBadges: string[];
};

const zeroStats = (): Stats => ({ hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 });
const baseIvs = (): Ivs => ({ hp: 27, attack: 31, defense: 18, specialAttack: 24, specialDefense: 29, speed: 22 });
const dayKey = () => new Date().toISOString().slice(0, 10);

export const initialGameState: GameState = {
  creature: {
    name: "Lumi", species: "Pikachu", evolutionStage: "Pikachu", level: 5, xp: 0, mood: "Feliz", hunger: 24, energy: 82, nature: "Serena", favoriteArtist: "Mara Sol", favoriteSong: "Neon Sunrise", shiny: false,
    musicalEvs: zeroStats(), normalEvs: zeroStats(), ivs: baseIvs(), shinyCharmUntil: null,
  },
  wallet: { pkc: 25420, pkd: 48 },
  inventory: { "Poké Ball": 12, "Super Ball": 3, "Ultra Ball": 1, "Baya energética": 4, "Accesorio aurora": 1, "Shiny Charm": 0, "Huevo musical": 0 },
  customization: { ball: "Poké Ball clásica", skin: "Aurora", accessory: "Accesorio aurora" },
  music: { connected: false, accountName: null, currentTrack: "Sin reproducción", currentArtist: "Conecta Spotify", currentAlbum: "", minutesListened: 0, xpEarned: 0, pkcEarned: 0, musicalEvsEarned: 0 },
  antiAbuse: { dayKey: dayKey(), acceptedMinutesToday: 0, lastAcceptedAt: null },
  breeding: { active: false, parentA: "Pikachu · Lumi", parentB: "Pikachu · pendiente", compatibility: 0, minutes: 0, goal: 30, masuda: false },
  missions: [
    { id: "daily-listen", cadence: "Diarias", title: "Ritmo diario", description: "Escucha 30 minutos de música", progress: 0, goal: 30, reward: { pkc: 250 }, claimed: false },
    { id: "daily-train", cadence: "Diarias", title: "Pequeño entrenamiento", description: "Entrena una estadística normal", progress: 0, goal: 1, reward: { pkc: 180 }, claimed: false },
    { id: "weekly-xp", cadence: "Semanales", title: "Sesión larga", description: "Consigue 2.000 XP musical", progress: 0, goal: 2000, reward: { pkc: 900, pkd: 2 }, claimed: false },
    { id: "monthly-breed", cadence: "Mensuales", title: "Nueva generación", description: "Incuba un huevo", progress: 0, goal: 1, reward: { pkd: 8, item: "Poké Ball" }, claimed: false },
  ],
  activeEvent: { id: "neon-week", title: "Semana Neon", multiplier: 1.15, endsAt: Date.now() + 5 * 24 * 60 * 60 * 1000 },
  lastBattle: null,
  dialogue: "¡Hola! ¿Qué escuchamos hoy?",
  notifications: ["Lumi está listo para escuchar música.", "Artista favorito detectado: Mara Sol."],
  lastSavedAt: Date.now(),
  starterChosen: false,
  collection: [],
  route: { current: 1, encounter: null },
  gymBadges: [],
};

const STORAGE_KEY = "pokebeat-save-v4";
type ActionResult = { ok: boolean; message: string };

type GameContextValue = {
  state: GameState;
  isHydrated: boolean;
  tapCreature: () => void;
  feedCreature: () => ActionResult;
  trainStat: (stat: StatKey) => ActionResult;
  awardListeningMinutes: (minutes: number) => void;
  setSpotifySession: (connected: boolean, accountName?: string | null) => void;
  setSpotifyPlayback: (playback: { isPlaying: boolean; track: string; artist: string; album: string; progressMs: number; durationMs: number }) => void;
  claimMission: (id: string) => ActionResult;
  buyShinyCharm: () => ActionResult;
  playMinigame: (kind: "reflejos" | "memoria" | "carrera") => ActionResult;
  startBreeding: (masuda: boolean) => ActionResult;
  advanceEgg: (minutes: number) => ActionResult;
  evolveCreature: () => ActionResult;
  runBattle: (opponent: string) => ActionResult;
  customize: (kind: "ball" | "skin", value: string) => void;
  chooseStarter: (species: string) => ActionResult;
  encounterRoute: (routeId: number) => ActionResult;
  captureEncounter: () => ActionResult;
  battleEncounter: () => ActionResult;
  setActivePokemon: (speciesOrId: string | number) => ActionResult;
  resetGame: () => void;
  challengeGym: (gymId: string) => ActionResult;
};

const GameContext = createContext<GameContextValue | null>(null);
function pushNotification(notifications: string[], message: string) { return [message, ...notifications.filter((item) => item !== message)].slice(0, 8); }
function mergeStoredState(stored: Partial<GameState>): GameState {
  return { ...initialGameState, ...stored, creature: { ...initialGameState.creature, ...(stored.creature ?? {}) }, music: { ...initialGameState.music, ...(stored.music ?? {}) }, antiAbuse: { ...initialGameState.antiAbuse, ...(stored.antiAbuse ?? {}) }, breeding: { ...initialGameState.breeding, ...(stored.breeding ?? {}) }, customization: { ...initialGameState.customization, ...(stored.customization ?? {}) }, route: { ...initialGameState.route, ...(stored.route ?? {}) }, collection: Array.isArray(stored.collection) ? stored.collection : initialGameState.collection, starterChosen: Boolean(stored.starterChosen), gymBadges: Array.isArray(stored.gymBadges) ? stored.gymBadges : initialGameState.gymBadges };
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(initialGameState);
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => { AsyncStorage.getItem(STORAGE_KEY).then((stored) => { if (stored) { try { setState(mergeStoredState(JSON.parse(stored))); } catch { setState(initialGameState); } } }).finally(() => setIsHydrated(true)); }, []);
  useEffect(() => { if (isHydrated) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, lastSavedAt: Date.now() })).catch(() => undefined); }, [isHydrated, state]);

  const tapCreature = useCallback(() => setState((current) => ({ ...current, creature: { ...current.creature, mood: "Curioso", energy: Math.min(100, current.creature.energy + 1) }, dialogue: DIALOGUES[Math.floor(Math.random() * DIALOGUES.length)], notifications: pushNotification(current.notifications, "Lumi reaccionó a tu toque.") })), []);
  const feedCreature = useCallback((): ActionResult => { let result: ActionResult = { ok: false, message: "No quedan Bayas energéticas." }; setState((current) => { const amount = current.inventory["Baya energética"] ?? 0; if (!amount) return current; result = { ok: true, message: "Lumi recuperó el ánimo y la energía." }; return { ...current, creature: { ...current.creature, mood: "Feliz", hunger: Math.max(0, current.creature.hunger - 30), energy: Math.min(100, current.creature.energy + 12) }, inventory: { ...current.inventory, "Baya energética": amount - 1 }, dialogue: "¡Ñam! Gracias por cuidarme.", notifications: pushNotification(current.notifications, result.message) }; }); return result; }, []);

  const trainStat = useCallback((stat: StatKey): ActionResult => { let result: ActionResult = { ok: false, message: "No se pudo entrenar." }; setState((current) => { const totalNormal = Object.values(current.creature.normalEvs).reduce((sum, value) => sum + value, 0); if (current.wallet.pkc < GAME_CONFIG.normalEvTrainingCost) { result = { ok: false, message: "Necesitas más PKC para entrenar." }; return current; } if (totalNormal >= 512 || current.creature.normalEvs[stat] >= 252) { result = { ok: false, message: "El límite de EV normal ya fue alcanzado." }; return current; } const nextEvs = { ...current.creature.normalEvs, [stat]: Math.min(252, current.creature.normalEvs[stat] + GAME_CONFIG.normalEvPerTraining) }; result = { ok: true, message: `Entrenamiento completado: +${GAME_CONFIG.normalEvPerTraining} EV ${stat.toUpperCase()}.` }; return { ...current, wallet: { ...current.wallet, pkc: current.wallet.pkc - GAME_CONFIG.normalEvTrainingCost }, creature: { ...current.creature, normalEvs: nextEvs, xp: current.creature.xp + GAME_CONFIG.xpPerTraining, mood: "Emocionado", energy: Math.max(0, current.creature.energy - 8) }, missions: current.missions.map((mission) => mission.id === "daily-train" ? { ...mission, progress: Math.min(mission.goal, mission.progress + 1) } : mission), dialogue: "¡Eso fue intenso! Me siento más fuerte.", notifications: pushNotification(current.notifications, result.message) }; }); return result; }, []);

  const awardListeningMinutes = useCallback((minutes: number) => { const requested = Math.min(60, Math.max(0, Math.floor(minutes))); if (!requested) return; setState((current) => { const today = dayKey(); const acceptedToday = current.antiAbuse.dayKey === today ? current.antiAbuse.acceptedMinutesToday : 0; const allowed = safeListeningMinutes(requested, acceptedToday); if (!allowed) return { ...current, dialogue: "Ya alcanzamos el límite seguro de escucha de hoy." }; const isFavorite = current.music.currentArtist.toLowerCase() === current.creature.favoriteArtist.toLowerCase(); const eventMultiplier = current.activeEvent && current.activeEvent.endsAt > Date.now() ? current.activeEvent.multiplier : 1; const multiplier = (isFavorite ? GAME_CONFIG.favoriteArtistXpMultiplier : 1) * eventMultiplier; const earnedXp = Math.floor(allowed * GAME_CONFIG.xpPerMinute * multiplier); const earnedPkc = Math.floor(allowed * GAME_CONFIG.pkcPerMinute); const nextMusicEvs = { ...current.creature.musicalEvs }; let earnedMusicEv = 0; const chance = Math.min(0.95, (allowed / 10) * GAME_CONFIG.musicEvChancePerTenMinutes * (isFavorite ? GAME_CONFIG.favoriteArtistMusicEvMultiplier : 1)); let evStat: StatKey | null = null; if (allowed >= GAME_CONFIG.musicEvMinimumMinutes && Math.random() < chance) { const keys = Object.keys(nextMusicEvs) as StatKey[]; evStat = keys[Math.floor(Math.random() * keys.length)]; earnedMusicEv = GAME_CONFIG.musicEvAmountMin + Math.floor(Math.random() * (GAME_CONFIG.musicEvAmountMax - GAME_CONFIG.musicEvAmountMin + 1)); nextMusicEvs[evStat] += earnedMusicEv; }
      let nextLevel = current.creature.level; let nextXp = current.creature.xp + earnedXp; let levelUp = false; while (nextXp >= Math.floor(GAME_CONFIG.levelBaseXp + nextLevel * GAME_CONFIG.levelLinearGrowth + Math.pow(nextLevel, 1.22) * GAME_CONFIG.levelCurveGrowth)) { nextXp -= Math.floor(GAME_CONFIG.levelBaseXp + nextLevel * GAME_CONFIG.levelLinearGrowth + Math.pow(nextLevel, 1.22) * GAME_CONFIG.levelCurveGrowth); nextLevel += 1; levelUp = true; }
      const evolved = nextLevel >= 25 && current.creature.evolutionStage === "Pikachu"; const nextNotifications = earnedMusicEv && evStat ? pushNotification(current.notifications, `¡EV musical obtenido! +${earnedMusicEv} en ${evStat.toUpperCase()}.`) : current.notifications; const levelMessage = levelUp ? `¡Lumi subió al nivel ${nextLevel}!` : null; return { ...current, creature: { ...current.creature, xp: nextXp, level: nextLevel, musicalEvs: nextMusicEvs, mood: isFavorite ? "Emocionado" : "Relajado", hunger: Math.min(100, current.creature.hunger + Math.ceil(allowed / 15)), energy: Math.max(0, current.creature.energy - Math.ceil(allowed / 20)) }, wallet: { ...current.wallet, pkc: current.wallet.pkc + earnedPkc }, music: { ...current.music, minutesListened: current.music.minutesListened + allowed, xpEarned: current.music.xpEarned + earnedXp, pkcEarned: current.music.pkcEarned + earnedPkc, musicalEvsEarned: current.music.musicalEvsEarned + earnedMusicEv }, antiAbuse: { dayKey: today, acceptedMinutesToday: acceptedToday + allowed, lastAcceptedAt: Date.now() }, missions: current.missions.map((mission) => mission.id === "daily-listen" ? { ...mission, progress: Math.min(mission.goal, mission.progress + allowed) } : mission.id === "weekly-xp" ? { ...mission, progress: Math.min(mission.goal, mission.progress + earnedXp) } : mission), dialogue: evolved ? "¡Siento una energía nueva! ¡Estoy listo para evolucionar!" : levelMessage ?? (isFavorite ? "¡Mi artista favorito! ¡Esta canción es perfecta!" : "La música me hace sentir bien."), notifications: evolved ? pushNotification(nextNotifications, "¡La evolución está lista para confirmarse!") : levelMessage ? pushNotification(nextNotifications, levelMessage) : nextNotifications }; }); }, []);

  const setSpotifySession = useCallback((connected: boolean, accountName: string | null = null) => setState((current) => ({ ...current, music: { ...current.music, connected, accountName }, dialogue: connected ? "¡Spotify conectado! Pon una canción y creceremos juntos." : "Spotify desconectado por ahora.", notifications: pushNotification(current.notifications, connected ? "Spotify conectado correctamente." : "Spotify desconectado.") })), []);
  const setSpotifyPlayback = useCallback((playback: { isPlaying: boolean; track: string; artist: string; album: string; progressMs: number; durationMs: number }) => setState((current) => ({ ...current, music: { ...current.music, currentTrack: playback.track, currentArtist: playback.artist, currentAlbum: playback.album, connected: true }, creature: { ...current.creature, mood: playback.artist.toLowerCase() === current.creature.favoriteArtist.toLowerCase() ? "Emocionado" : playback.isPlaying ? "Relajado" : current.creature.mood }, dialogue: playback.artist.toLowerCase() === current.creature.favoriteArtist.toLowerCase() ? "¡Mi artista favorito está sonando!" : current.dialogue })), []);
  const claimMission = useCallback((id: string): ActionResult => { let result: ActionResult = { ok: false, message: "Misión no disponible." }; setState((current) => { const mission = current.missions.find((item) => item.id === id); if (!mission || mission.claimed || mission.progress < mission.goal) return current; result = { ok: true, message: `Recompensa reclamada: ${mission.reward.pkc ? `+${mission.reward.pkc} PKC ` : ""}${mission.reward.pkd ? `+${mission.reward.pkd} PKD` : ""}`.trim() }; return { ...current, wallet: { pkc: current.wallet.pkc + (mission.reward.pkc ?? 0), pkd: current.wallet.pkd + (mission.reward.pkd ?? 0) }, inventory: mission.reward.item ? { ...current.inventory, [mission.reward.item]: (current.inventory[mission.reward.item] ?? 0) + 1 } : current.inventory, missions: current.missions.map((item) => item.id === id ? { ...item, claimed: true } : item), notifications: pushNotification(current.notifications, result.message), dialogue: "¡Misión completada!" }; }); return result; }, []);
  const buyShinyCharm = useCallback((): ActionResult => { let result: ActionResult = { ok: false, message: "No se pudo comprar el amuleto." }; setState((current) => { if (current.wallet.pkd < GAME_CONFIG.shinyCharmCostPkd) { result = { ok: false, message: `Necesitas ${GAME_CONFIG.shinyCharmCostPkd} PKD.` }; return current; } result = { ok: true, message: `Shiny Charm activo durante ${GAME_CONFIG.shinyCharmDays} días.` }; return { ...current, wallet: { ...current.wallet, pkd: current.wallet.pkd - GAME_CONFIG.shinyCharmCostPkd }, creature: { ...current.creature, shinyCharmUntil: Date.now() + GAME_CONFIG.shinyCharmDays * 24 * 60 * 60 * 1000 }, inventory: { ...current.inventory, "Shiny Charm": (current.inventory["Shiny Charm"] ?? 0) + 1 }, notifications: pushNotification(current.notifications, result.message) }; }); return result; }, []);

  const playMinigame = useCallback((kind: "reflejos" | "memoria" | "carrera"): ActionResult => { const labels = { reflejos: "Reflejos", memoria: "Memoria", carrera: "Carrera" }; const reward = kind === "carrera" ? 90 : 70; const result = { ok: true, message: `${labels[kind]} completado: +${reward} PKC y +${GAME_CONFIG.xpPerTraining * 2} XP.` }; setState((current) => ({ ...current, wallet: { ...current.wallet, pkc: current.wallet.pkc + reward }, creature: { ...current.creature, xp: current.creature.xp + GAME_CONFIG.xpPerTraining * 2, mood: "Alegre" }, dialogue: "¡Otra partida! Me encanta entrenar jugando.", notifications: pushNotification(current.notifications, result.message) })); return result; }, []);
  const startBreeding = useCallback((masuda: boolean): ActionResult => { let result: ActionResult = { ok: false, message: "No se pudo iniciar la crianza." }; setState((current) => { const balls = current.inventory["Poké Ball"] ?? 0; if (balls < 1) { result = { ok: false, message: "Necesitas una Poké Ball para preparar el nido." }; return current; } result = { ok: true, message: masuda ? "Crianza iniciada con Método Masuda." : "Crianza iniciada: el huevo necesita música para incubarse." }; return { ...current, inventory: { ...current.inventory, "Poké Ball": balls - 1 }, breeding: { active: true, parentA: `${current.creature.species} · ${current.creature.name}`, parentB: "Criatura compatible · selección futura", compatibility: masuda ? 92 : 76, minutes: 0, goal: 30, masuda }, notifications: pushNotification(current.notifications, result.message), dialogue: "¿Escuchamos música para incubar el huevo?" }; }); return result; }, []);
  const advanceEgg = useCallback((minutes: number): ActionResult => { let result: ActionResult = { ok: false, message: "No hay huevo activo." }; setState((current) => { if (!current.breeding.active) return current; const nextMinutes = Math.min(current.breeding.goal, current.breeding.minutes + Math.max(0, minutes)); if (nextMinutes < current.breeding.goal) { result = { ok: true, message: `Incubación: ${nextMinutes} / ${current.breeding.goal} min.` }; return { ...current, breeding: { ...current.breeding, minutes: nextMinutes }, dialogue: "El huevo vibra al ritmo de la música." }; } result = { ok: true, message: "¡Huevo eclosionado! Nueva criatura añadida a la colección." }; return { ...current, breeding: { ...current.breeding, active: false, minutes: nextMinutes }, inventory: { ...current.inventory, "Huevo musical": (current.inventory["Huevo musical"] ?? 0) + 1 }, missions: current.missions.map((mission) => mission.id === "monthly-breed" ? { ...mission, progress: Math.min(mission.goal, mission.progress + 1) } : mission), dialogue: "¡Eclosionó! La nueva generación trae una melodía distinta.", notifications: pushNotification(current.notifications, result.message) }; }); return result; }, []);
  const evolveCreature = useCallback((): ActionResult => { let result: ActionResult = { ok: false, message: "Aún no cumple el nivel requerido." }; setState((current) => { if (current.creature.level < 25 || current.creature.evolutionStage !== "Pikachu") return current; result = { ok: true, message: "¡Pikachu evolucionó a Raichu!" }; return { ...current, creature: { ...current.creature, evolutionStage: "Raichu", species: "Raichu", mood: "Emocionado" }, dialogue: "¡RAI! ¡Mi nueva forma tiene ritmo propio!", notifications: pushNotification(current.notifications, result.message) }; }); return result; }, []);
  const runBattle = useCallback((opponent: string): ActionResult => { let result: ActionResult = { ok: true, message: "Victoria en combate." }; setState((current) => { const power = current.creature.level + Object.values(current.creature.normalEvs).reduce((sum, value) => sum + value, 0) / 20 + Object.values(current.creature.musicalEvs).reduce((sum, value) => sum + value, 0) / 10; const victory = power >= 35 || Math.random() > 0.25; const reward = victory ? 180 : 30; result = { ok: victory, message: victory ? `¡Victoria contra ${opponent}! +${reward} PKC.` : `${opponent} ganó esta vez. +${reward} PKC por participar.` }; return { ...current, wallet: { ...current.wallet, pkc: current.wallet.pkc + reward }, lastBattle: { opponent, result: victory ? "victoria" : "derrota", reward }, creature: { ...current.creature, mood: victory ? "Alegre" : "Cansado", energy: Math.max(0, current.creature.energy - 15) }, dialogue: victory ? "¡Mi música me dio el impulso final!" : "Necesito descansar y volver a entrenar.", notifications: pushNotification(current.notifications, result.message) }; }); return result; }, []);
  const customize = useCallback((kind: "ball" | "skin", value: string) => setState((current) => ({ ...current, customization: { ...current.customization, [kind]: value }, notifications: pushNotification(current.notifications, `${kind === "ball" ? "Poké Ball" : "Skin"} equipada: ${value}.`) })), []);

  const challengeGym = useCallback((gymId: string): ActionResult => { let result: ActionResult = { ok: false, message: "Ese gimnasio no está disponible." }; setState((current) => { const gym = KANTO_GYMS.find((item) => item.id === gymId); const expected = nextGym(current.gymBadges); if (!gym) return current; if (current.gymBadges.includes(gym.id)) { result = { ok: false, message: `Ya tienes la ${gym.badge}.` }; return current; } if (!expected || expected.id !== gym.id) { result = { ok: false, message: `Primero debes vencer a ${expected?.leader ?? "todos los líderes"}.` }; return current; } const power = current.creature.level + Object.values(current.creature.normalEvs).reduce((sum, value) => sum + value, 0) / 20 + Object.values(current.creature.musicalEvs).reduce((sum, value) => sum + value, 0) / 10; const requiredPower = gym.team[gym.team.length - 1].level + 10; const victory = power >= requiredPower || Math.random() > 0.34; const reward = victory ? 600 + gym.number * 150 : 80; result = victory ? { ok: true, message: `¡Venciste a ${gym.leader}! Obtienes la ${gym.badge} y +${reward} PKC. Ahora puedes explorar hasta la ruta ${unlockedRouteCount(current.gymBadges.length + 1)}.` } : { ok: false, message: `${gym.leader} ganó esta vez. Entrena y vuelve a intentarlo.` }; return { ...current, gymBadges: victory ? [...current.gymBadges, gym.id] : current.gymBadges, wallet: { ...current.wallet, pkc: current.wallet.pkc + reward }, lastBattle: { opponent: `Líder ${gym.leader}`, result: victory ? "victoria" : "derrota", reward }, creature: { ...current.creature, mood: victory ? "Alegre" : "Cansado", energy: Math.max(0, current.creature.energy - 18) }, dialogue: victory ? `¡La ${gym.badge} es nuestra!` : "Necesito prepararme mejor para ese gimnasio.", notifications: pushNotification(current.notifications, result.message) }; }); return result; }, []);
  const chooseStarter = useCallback((species: string): ActionResult => { let result: ActionResult = { ok: false, message: "Ya elegiste tu Pokémon inicial." }; setState((current) => { if (current.starterChosen) return current; const entry = getPokedexEntry(species); result = { ok: true, message: `¡${entry.name} será tu compañero inicial!` }; return { ...current, starterChosen: true, creature: { ...current.creature, species: entry.name, evolutionStage: entry.name, name: entry.name === "Pikachu" ? "Lumi" : entry.name, level: 5, xp: 0, musicalEvs: zeroStats(), normalEvs: zeroStats() }, collection: [entry.id], dialogue: `¡Vamos, ${entry.name}! Nuestra aventura comienza.`, notifications: pushNotification(current.notifications, result.message) }; }); return result; }, []);
  const encounterRoute = useCallback((routeId: number): ActionResult => { const route = routeFor(routeId); let result: ActionResult = { ok: false, message: `Esta ruta está bloqueada. Vence líderes para desbloquear hasta la ruta ${unlockedRouteCount(0)}.` }; setState((current) => { const maxRoute = unlockedRouteCount(current.gymBadges.length); if (route.id > maxRoute) { result = { ok: false, message: `Ruta bloqueada: necesitas más medallas. Actualmente puedes llegar hasta la ruta ${maxRoute}.` }; return current; } const found = route.species[Math.floor(Math.random() * route.species.length)]; const level = route.minLevel + Math.floor(Math.random() * (route.maxLevel - route.minLevel + 1)); result = { ok: true, message: `¡Apareció ${found.name} salvaje de nivel ${level} en ${route.name}!` }; return { ...current, route: { current: route.id, encounter: { id: found.id, level, weakened: false } }, dialogue: result.message, notifications: pushNotification(current.notifications, result.message) }; }); return result; }, []);
  const battleEncounter = useCallback((): ActionResult => { let result: ActionResult = { ok: false, message: "No hay ningún Pokémon salvaje delante." }; setState((current) => { const encounter = current.route.encounter; if (!encounter) return current; if (encounter.weakened) { result = { ok: false, message: "El Pokémon ya está debilitado: ahora puedes capturarlo." }; return current; } const power = current.creature.level + Object.values(current.creature.normalEvs).reduce((sum, value) => sum + value, 0) / 20 + Object.values(current.creature.musicalEvs).reduce((sum, value) => sum + value, 0) / 10; const victory = power >= encounter.level + 3 || Math.random() > 0.3; const species = getPokedexEntry(encounter.id); const reward = victory ? encounter.level * 2 : 0; result = victory ? { ok: true, message: `¡Venciste a ${species.name} salvaje! +${reward} PKC. Ahora está debilitado: elige una Ball para capturarlo.` } : { ok: false, message: `¡${species.name} escapó después del combate! Busca otro encuentro.` }; return { ...current, route: { ...current.route, encounter: victory ? { ...encounter, weakened: true } : null }, wallet: { ...current.wallet, pkc: current.wallet.pkc + reward }, creature: { ...current.creature, energy: Math.max(0, current.creature.energy - 8), mood: victory ? "Emocionado" : "Cansado" }, lastBattle: { opponent: `${species.name} salvaje`, result: victory ? "victoria" : "derrota", reward }, dialogue: result.message, notifications: pushNotification(current.notifications, result.message) }; }); return result; }, []);

  const captureEncounter = useCallback((): ActionResult => { let result: ActionResult = { ok: false, message: "No hay ningún Pokémon salvaje delante." }; setState((current) => { const encounter = current.route.encounter; if (!encounter) return current; if (!encounter.weakened) { result = { ok: false, message: "Primero debes combatir y debilitar al Pokémon salvaje." }; return current; } const ball = current.customization.ball || "Poké Ball"; const amount = current.inventory[ball] ?? 0; if (!amount) { result = { ok: false, message: `No tienes ${ball}. Equipa otra Ball o consigue más.` }; return current; } const baseChance = ball === "Ultra Ball" ? 0.78 : ball === "Super Ball" ? 0.58 : 0.38; const levelPenalty = Math.max(0, (encounter.level - current.creature.level) * 0.012); const success = Math.random() < Math.max(0.12, baseChance - levelPenalty); const nextInventory = { ...current.inventory, [ball]: amount - 1 }; if (!success) { result = { ok: false, message: `¡${ball} falló! El Pokémon escapó del intento.` }; return { ...current, inventory: nextInventory, dialogue: result.message, notifications: pushNotification(current.notifications, result.message) }; } const species = getPokedexEntry(encounter.id); result = { ok: true, message: `¡Capturaste a ${species.name} con ${ball}!` }; return { ...current, inventory: nextInventory, collection: current.collection.includes(encounter.id) ? current.collection : [...current.collection, encounter.id], route: { ...current.route, encounter: null }, wallet: { ...current.wallet, pkc: current.wallet.pkc + encounter.level * 4 }, dialogue: result.message, notifications: pushNotification(current.notifications, result.message) }; }); return result; }, []);
  const setActivePokemon = useCallback((speciesOrId: string | number): ActionResult => { let result: ActionResult = { ok: false, message: "Ese Pokémon aún no está en tu colección." }; setState((current) => { const entry = getPokedexEntry(String(speciesOrId)); if (!current.collection.includes(entry.id)) return current; result = { ok: true, message: `¡${entry.name} es ahora tu Pokémon activo!` }; return { ...current, creature: { ...current.creature, species: entry.name, evolutionStage: entry.name, name: entry.name === "Pikachu" ? "Lumi" : entry.name, level: Math.max(5, Math.min(current.creature.level, 50)), xp: 0 }, dialogue: `¡Vamos, ${entry.name}! Te toca salir al ritmo de la música.`, notifications: pushNotification(current.notifications, result.message) }; }); return result; }, []);

  const resetGame = useCallback(() => { void AsyncStorage.multiRemove(["pokebeat-save-v2", "pokebeat-save-v3"]); setState({ ...initialGameState, activeEvent: null, starterChosen: false, collection: [], gymBadges: [], route: { current: 1, encounter: null }, lastSavedAt: Date.now() }); }, []);

  const value = useMemo(() => ({ state, isHydrated, tapCreature, feedCreature, trainStat, awardListeningMinutes, setSpotifySession, setSpotifyPlayback, claimMission, buyShinyCharm, playMinigame, startBreeding, advanceEgg, evolveCreature, runBattle, customize, chooseStarter, encounterRoute, captureEncounter, battleEncounter, setActivePokemon, resetGame, challengeGym }), [state, isHydrated, tapCreature, feedCreature, trainStat, awardListeningMinutes, setSpotifySession, setSpotifyPlayback, claimMission, buyShinyCharm, playMinigame, startBreeding, advanceEgg, evolveCreature, runBattle, customize, chooseStarter, encounterRoute, captureEncounter, battleEncounter, setActivePokemon, resetGame, challengeGym]);
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() { const context = useContext(GameContext); if (!context) throw new Error("useGame debe usarse dentro de GameProvider"); return context; }
