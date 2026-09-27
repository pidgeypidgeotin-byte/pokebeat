import { describe, expect, it } from "vitest";

import { FIRST_151, getPokedexEntry } from "../lib/pokedex";

describe("Pokédex de Kanto", () => {
  it("incluye exactamente los primeros 151 Pokémon", () => {
    expect(FIRST_151).toHaveLength(151);
    expect(FIRST_151[0]).toMatchObject({ id: 1, name: "Bulbasaur" });
    expect(FIRST_151[24]).toMatchObject({ id: 25, name: "Pikachu" });
    expect(FIRST_151[150]).toMatchObject({ id: 151, name: "Mew" });
    expect(FIRST_151.every((entry) => entry.sprite.startsWith("data:image/png;base64,") || entry.sprite.includes(`/pokemon/${entry.id}.png`))).toBe(true);
  });

  it("encuentra la especie de la mascota actual", () => {
    expect(getPokedexEntry("Pikachu").id).toBe(25);
    expect(getPokedexEntry("desconocido").name).toBe("Pikachu");
  });
});
