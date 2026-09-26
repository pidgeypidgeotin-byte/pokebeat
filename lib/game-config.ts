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

export type BaseStats = Record<StatKey, number>;

// Base stats de las líneas usadas por PokéBeat (formato moderno de Pokémon).
export const POKEMON_BASE_STATS: Record<string, BaseStats> = {
  Pichu: { hp: 20, attack: 40, defense: 15, specialAttack: 35, specialDefense: 35, speed: 60 },
  Pikachu: { hp: 35, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50, speed: 90 },
  Raichu: { hp: 60, attack: 90, defense: 55, specialAttack: 90, specialDefense: 80, speed: 110 },
};

export function calculatePokemonStats(species: string, level: number, ivs: Record<StatKey, number>, normalEvs: Record<StatKey, number>, musicalEvs: Record<StatKey, number>): BaseStats {
  const base = POKEMON_BASE_STATS[species] ?? POKEMON_BASE_STATS.Pikachu;
  const safeLevel = Math.max(1, Math.floor(level));
  return Object.fromEntries(MUSIC_STATS.map(({ key }) => {
    const ev = Math.max(0, normalEvs[key] ?? 0) + Math.max(0, musicalEvs[key] ?? 0);
    const core = Math.floor(((2 * base[key] + Math.max(0, ivs[key] ?? 0) + Math.floor(ev / 4)) * safeLevel) / 100);
    return [key, key === "hp" ? core + safeLevel + 10 : core + 5];
  })) as BaseStats;
}

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
