import { FIRST_151, type PokedexEntry } from "@/lib/pokedex";

export const ROULETTE_COST = 1500;

const FIRST_STAGE_NAMES = new Set([
  "Bulbasaur", "Charmander", "Squirtle", "Caterpie", "Weedle", "Pidgey", "Rattata", "Spearow", "Ekans", "Pikachu", "Sandshrew", "Nidoran♀", "Nidoran♂", "Clefairy", "Vulpix", "Jigglypuff", "Zubat", "Oddish", "Paras", "Venonat", "Diglett", "Meowth", "Psyduck", "Mankey", "Growlithe", "Poliwag", "Abra", "Machop", "Bellsprout", "Tentacool", "Geodude", "Ponyta", "Slowpoke", "Magnemite", "Farfetch'd", "Doduo", "Seel", "Grimer", "Shellder", "Gastly", "Onix", "Drowzee", "Krabby", "Voltorb", "Exeggcute", "Cubone", "Hitmonlee", "Hitmonchan", "Lickitung", "Koffing", "Rhyhorn", "Chansey", "Tangela", "Kangaskhan", "Horsea", "Goldeen", "Staryu", "Mr. Mime", "Scyther", "Jynx", "Electabuzz", "Magmar", "Pinsir", "Tauros", "Magikarp", "Lapras", "Ditto", "Eevee", "Omanyte", "Kabuto", "Aerodactyl", "Snorlax", "Articuno", "Zapdos", "Moltres", "Dratini", "Mewtwo", "Mew",
]);

export const KANTO_FIRST_STAGES: PokedexEntry[] = FIRST_151.filter((entry) => FIRST_STAGE_NAMES.has(entry.name));

export function spinKantoRoulette() {
  return KANTO_FIRST_STAGES[Math.floor(Math.random() * KANTO_FIRST_STAGES.length)] ?? FIRST_151[0];
}
