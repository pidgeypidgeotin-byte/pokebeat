import { describe, expect, it } from "vitest";
import { KANTO_GYMS, unlockedRouteCount } from "../lib/gyms";
import { KANTO_ROUTES } from "../lib/routes";

describe("gimnasios y progreso de Kanto", () => {
  it("define 8 líderes y 24 rutas", () => {
    expect(KANTO_GYMS).toHaveLength(8);
    expect(KANTO_ROUTES).toHaveLength(24);
    expect(new Set(KANTO_ROUTES.flatMap((route) => route.species.map((entry) => entry.id))).size).toBe(151);
  });

  it("solo abre 3 rutas al inicio y avanza de tres en tres", () => {
    expect(unlockedRouteCount(0)).toBe(3);
    expect(unlockedRouteCount(1)).toBe(6);
    expect(unlockedRouteCount(7)).toBe(24);
    expect(unlockedRouteCount(8)).toBe(24);
  });
});
