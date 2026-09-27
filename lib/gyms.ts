export type Gym = {
  id: string;
  number: number;
  leader: string;
  city: string;
  specialty: string;
  badge: string;
  unlocksThroughRoute: number;
  team: { species: string; level: number }[];
};

export const KANTO_GYMS: Gym[] = [
  { id: "brock", number: 1, leader: "Brock", city: "Ciudad Plateada", specialty: "Roca", badge: "Medalla Roca", unlocksThroughRoute: 6, team: [{ species: "Geodude", level: 12 }, { species: "Onix", level: 14 }] },
  { id: "misty", number: 2, leader: "Misty", city: "Ciudad Celeste", specialty: "Agua", badge: "Medalla Cascada", unlocksThroughRoute: 9, team: [{ species: "Staryu", level: 18 }, { species: "Starmie", level: 21 }] },
  { id: "lt-surge", number: 3, leader: "Lt. Surge", city: "Ciudad Carmín", specialty: "Eléctrico", badge: "Medalla Trueno", unlocksThroughRoute: 12, team: [{ species: "Voltorb", level: 22 }, { species: "Raichu", level: 24 }] },
  { id: "erika", number: 4, leader: "Erika", city: "Ciudad Azulona", specialty: "Planta", badge: "Medalla Arcoíris", unlocksThroughRoute: 15, team: [{ species: "Victreebel", level: 29 }, { species: "Vileplume", level: 29 }, { species: "Tangela", level: 31 }] },
  { id: "koga", number: 5, leader: "Koga", city: "Ciudad Fucsia", specialty: "Veneno", badge: "Medalla Alma", unlocksThroughRoute: 18, team: [{ species: "Koffing", level: 37 }, { species: "Muk", level: 39 }, { species: "Weezing", level: 43 }] },
  { id: "sabrina", number: 6, leader: "Sabrina", city: "Ciudad Azafrán", specialty: "Psíquico", badge: "Medalla Pantano", unlocksThroughRoute: 21, team: [{ species: "Mr. Mime", level: 37 }, { species: "Kadabra", level: 38 }, { species: "Alakazam", level: 43 }] },
  { id: "blaine", number: 7, leader: "Blaine", city: "Isla Canela", specialty: "Fuego", badge: "Medalla Volcán", unlocksThroughRoute: 24, team: [{ species: "Growlithe", level: 42 }, { species: "Ponyta", level: 40 }, { species: "Rapidash", level: 47 }] },
  { id: "giovanni", number: 8, leader: "Giovanni", city: "Ciudad Verde", specialty: "Tierra", badge: "Medalla Tierra", unlocksThroughRoute: 24, team: [{ species: "Rhyhorn", level: 45 }, { species: "Nidoqueen", level: 46 }, { species: "Nidoking", level: 49 }] },
];

export function unlockedRouteCount(badgeCount: number) { return Math.min(24, 3 + badgeCount * 3); }
export function nextGym(badges: string[]) { return KANTO_GYMS[badges.length] ?? null; }
