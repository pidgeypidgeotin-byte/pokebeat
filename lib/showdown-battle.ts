import { Battle, type PokemonSet } from "@pkmn/sim";

export type BattleTeamMember = { species: string; level: number; moves?: string[] };
export type BattleMove = { id: string; name: string; pp?: number };
export type ShowdownSnapshot = {
  sessionId: string;
  turn: number;
  player: { species: string; hp: number; maxHp: number; moves: BattleMove[] };
  opponent: { species: string; hp: number; maxHp: number; moves: BattleMove[] };
  log: string[];
  ended: boolean;
  winner: "player" | "opponent" | null;
};

const sessions = new Map<string, Battle>();
let nextSessionId = 1;

const DEFAULT_MOVES: Record<string, string[]> = {
  Pikachu: ["thunderbolt", "quickattack", "tackle", "growl"],
  Raichu: ["thunderbolt", "quickattack", "swift", "tackle"],
  Bulbasaur: ["vinewhip", "tackle", "growl", "leechseed"],
  Ivysaur: ["razorleaf", "vinewhip", "tackle", "leechseed"],
  Venusaur: ["razorleaf", "sludgebomb", "tackle", "synthesis"],
  Charmander: ["ember", "scratch", "smokescreen", "metalclaw"],
  Charmeleon: ["flamethrower", "slash", "ember", "smokescreen"],
  Charizard: ["flamethrower", "slash", "fly", "dragonclaw"],
  Squirtle: ["watergun", "tackle", "withdraw", "bite"],
  Wartortle: ["waterpulse", "bite", "watergun", "withdraw"],
  Blastoise: ["surf", "bite", "waterpulse", "protect"],
};

function movesFor(species: string, moves?: string[]) {
  return moves?.length ? moves : DEFAULT_MOVES[species] ?? ["tackle", "growl", "quickattack", "leer"];
}

function setFor(member: BattleTeamMember, evBonus = 0): PokemonSet {
  const level = Math.max(1, Math.min(100, member.level + evBonus));
  return {
    name: member.species,
    species: member.species,
    item: "",
    ability: "",
    gender: "",
    level,
    moves: movesFor(member.species, member.moves),
    nature: "Serious",
    evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
  };
}

function sideSnapshot(battle: Battle, sideId: "p1" | "p2") {
  const active = battle.getSide(sideId).active[0] ?? battle.getSide(sideId).pokemon.find((item) => item.hp > 0);
  if (!active) return { species: "—", hp: 0, maxHp: 1, moves: [] as BattleMove[] };
  return {
    species: active.species.name,
    hp: active.hp,
    maxHp: active.maxhp,
    moves: active.moveSlots.map((move) => ({ id: move.id, name: move.move, pp: move.pp })),
  };
}

function winnerFor(battle: Battle): "player" | "opponent" | null {
  if (!battle.ended) return null;
  if (battle.winner === "Lumi" || battle.winner === "PokéBeat") return "player";
  if (battle.winner) return "opponent";
  const playerLeft = battle.getSide("p1").pokemonLeft;
  const opponentLeft = battle.getSide("p2").pokemonLeft;
  return playerLeft > opponentLeft ? "player" : opponentLeft > playerLeft ? "opponent" : null;
}

function autoSwitchOpponent(battle: Battle) {
  let guard = 0;
  while (!battle.ended && battle.getSide("p2").requestState === "switch" && guard++ < 6) {
    const index = battle.getSide("p2").pokemon.findIndex((pokemon) => pokemon.hp > 0 && !pokemon.isActive);
    if (index < 0) break;
    battle.choose("p2", `switch ${index + 1}`);
  }
}

function snapshot(sessionId: string, battle: Battle, previousLogLength = 0): ShowdownSnapshot {
  return {
    sessionId,
    turn: battle.turn,
    player: sideSnapshot(battle, "p1"),
    opponent: sideSnapshot(battle, "p2"),
    log: battle.log.slice(previousLogLength).filter((line) => line.startsWith("|move|") || line.startsWith("|-damage|") || line.startsWith("|faint|")),
    ended: battle.ended,
    winner: winnerFor(battle),
  };
}

export function startShowdownBattle(player: BattleTeamMember, opponent: BattleTeamMember[], musicalEvTotal = 0): ShowdownSnapshot {
  const sessionId = `battle-${Date.now()}-${nextSessionId++}`;
  const evBonus = Math.min(12, Math.floor(Math.max(0, musicalEvTotal) / 60));
  const battle = new Battle({
    formatid: "gen9customgame" as any,
    strictChoices: true,
    p1: { name: "Lumi", team: [setFor(player, evBonus)] },
    p2: { name: "Rival", team: opponent.map((member) => setFor(member)) },
  });
  sessions.set(sessionId, battle);
  return snapshot(sessionId, battle);
}

export function chooseShowdownMove(sessionId: string, moveIndex: number): ShowdownSnapshot {
  const battle = sessions.get(sessionId);
  if (!battle) throw new Error("La sesión de combate ya no existe.");
  if (battle.ended) return snapshot(sessionId, battle);
  autoSwitchOpponent(battle);
  const player = battle.getSide("p1").active[0];
  const opponent = battle.getSide("p2").active[0];
  if (!player || !opponent || player.hp <= 0) return snapshot(sessionId, battle);
  const playerMove = player.moveSlots[moveIndex]?.id ?? player.moveSlots[0]?.id ?? "tackle";
  const opponentMove = opponent.moveSlots[0]?.id ?? "tackle";
  const previousLogLength = battle.log.length;
  battle.makeChoices(`move ${playerMove}`, `move ${opponentMove}`);
  autoSwitchOpponent(battle);
  return snapshot(sessionId, battle, previousLogLength);
}

export function discardShowdownBattle(sessionId: string) {
  sessions.delete(sessionId);
}

export function movesForSpecies(species: string) {
  return movesFor(species).map((id) => ({ id, name: id.replace(/(^|[-_])\w/g, (value) => value.toUpperCase()).replace(/[-_]/g, " ") }));
}
