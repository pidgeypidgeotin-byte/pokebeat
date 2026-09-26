import { describe, expect, it } from "vitest";

import { calculatePokemonStats, DIALOGUES, GAME_CONFIG, MUSIC_STATS, POKEMON_BASE_STATS, safeListeningMinutes, xpForNextLevel } from "../lib/game-config";

describe("PokéBeat - configuración de progresión", () => {
  it("mantiene una curva de XP creciente sin fijar un nivel máximo", () => {
    expect(xpForNextLevel(1)).toBeGreaterThan(0);
    expect(xpForNextLevel(100)).toBeGreaterThan(xpForNextLevel(10));
    expect(xpForNextLevel(10000)).toBeGreaterThan(xpForNextLevel(1000));
  });

  it("expone por separado los seis stats de EV musicales", () => {
    expect(MUSIC_STATS.map((stat) => stat.key)).toEqual(["hp", "attack", "defense", "specialAttack", "specialDefense", "speed"]);
    expect(new Set(MUSIC_STATS.map((stat) => stat.label)).size).toBe(6);
  });

  it("mantiene los parámetros de EV musical en valores jugables", () => {
    expect(GAME_CONFIG.musicEvChancePerTenMinutes).toBeGreaterThan(0);
    expect(GAME_CONFIG.musicEvChancePerTenMinutes).toBeLessThan(1);
    expect(GAME_CONFIG.musicEvAmountMax).toBeGreaterThanOrEqual(GAME_CONFIG.musicEvAmountMin);
    expect(GAME_CONFIG.musicEvMinimumMinutes).toBeGreaterThan(0);
  });

  it("incluye variedad suficiente de diálogos de mascota", () => {
    expect(DIALOGUES.length).toBeGreaterThanOrEqual(6);
    expect(new Set(DIALOGUES).size).toBe(DIALOGUES.length);
  });

  it("limita saltos de tiempo y el volumen diario aceptado", () => {
    expect(safeListeningMinutes(999, 0)).toBe(60);
    expect(safeListeningMinutes(60, 330)).toBe(30);
    expect(safeListeningMinutes(60, 360)).toBe(0);
    expect(safeListeningMinutes(-10, 0)).toBe(0);
  });

  it("usa los base stats reales de Pikachu y escala con IV/EV/nivel", () => {
    expect(POKEMON_BASE_STATS.Pikachu).toEqual({ hp: 35, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50, speed: 90 });
    const zero = { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 };
    const stats = calculatePokemonStats("Pikachu", 1, zero, zero, zero);
    expect(stats.hp).toBe(11);
    expect(stats.speed).toBe(6);
  });
});
