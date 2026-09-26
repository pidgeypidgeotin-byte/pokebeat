export const GAME_CONFIG = {
  xpPerMinute: 12,
  pkcPerMinute: 3,
  favoriteArtistXpMultiplier: 1.25,
  favoriteArtistMusicEvMultiplier: 1.1,
  musicEvChancePerTenMinutes: 0.08,
  musicEvMinimumMinutes: 3,
  musicEvAmountMin: 1,
  musicEvAmountMax: 2,
  normalEvPerTraining: 4,
  normalEvTrainingCost: 20,
  xpPerTraining: 30,
  shinyBaseChance: 1 / 4096,
  shinyCharmDays: 7,
  shinyCharmCostPkd: 25,
  levelBaseXp: 420,
  levelLinearGrowth: 145,
  levelCurveGrowth: 18,
} as const;

export const MUSIC_STATS = [
  { key: "hp", label: "HP", icon: "♥" },
  { key: "attack", label: "ATK", icon: "◆" },
  { key: "defense", label: "DEF", icon: "⬟" },
  { key: "specialAttack", label: "SPA", icon: "✦" },
  { key: "specialDefense", label: "SPD", icon: "✧" },
  { key: "speed", label: "SPE", icon: "➤" },
] as const;

export type StatKey = (typeof MUSIC_STATS)[number]["key"];

export const DIALOGUES = [
  "¡Hola! ¿Qué escuchamos hoy?",
  "Esta canción me pone de buen humor.",
  "¿Puedes poner algo con mucho ritmo?",
  "¡Tengo ganas de entrenar!",
  "Mi artista favorito está sonando…",
  "Un minuto de música y me siento genial.",
  "Prometo cuidar tus auriculares.",
  "Creo que hoy puedo evolucionar.",
];

export function xpForNextLevel(level: number) {
  return Math.floor(
    GAME_CONFIG.levelBaseXp +
      level * GAME_CONFIG.levelLinearGrowth +
      Math.pow(level, 1.22) * GAME_CONFIG.levelCurveGrowth,
  );
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("es-ES").format(Math.max(0, Math.floor(value)));
}

export function safeListeningMinutes(minutes: number, alreadyAcceptedToday: number) {
  const requested = Math.min(60, Math.max(0, Math.floor(minutes)));
  const remaining = Math.max(0, 360 - Math.max(0, Math.floor(alreadyAcceptedToday)));
  return Math.min(requested, remaining);
}
