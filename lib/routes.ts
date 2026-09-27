import { FIRST_151, type PokedexEntry } from "./pokedex";

export type Route = { id: number; name: string; theme: string; minLevel: number; maxLevel: number; species: PokedexEntry[] };

const ROUTE_NAMES = ["Ruta 1", "Ruta 2", "Bosque Verde", "Ruta 3", "Monte Luna", "Ruta 4", "Ruta 5", "Ruta 6", "Ruta 7", "Ruta 8", "Ruta 9", "Ruta 10", "Túnel Roca", "Ruta 11", "Ruta 12", "Ruta 13", "Ruta 14", "Ruta 15", "Ruta 16", "Ruta 17", "Ruta 18", "Zona Safari", "Islas Espuma", "Calle Victoria"];
const THEMES = ["Pradera", "Bosque", "Cueva", "Costa", "Montaña", "Ciudad", "Pantano", "Volcán"];

export const KANTO_ROUTES: Route[] = ROUTE_NAMES.map((name, index) => {
  const start = Math.floor(index * FIRST_151.length / ROUTE_NAMES.length);
  const end = Math.floor((index + 1) * FIRST_151.length / ROUTE_NAMES.length);
  const species = FIRST_151.slice(start, Math.max(start + 1, end));
  return { id: index + 1, name, theme: THEMES[index % THEMES.length], minLevel: 2 + index * 2, maxLevel: 5 + index * 2, species };
});

export function routeFor(id: number) { return KANTO_ROUTES[Math.max(0, Math.min(KANTO_ROUTES.length - 1, id - 1))]; }
