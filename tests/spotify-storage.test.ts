import { beforeEach, describe, expect, it, vi } from "vitest";

const asyncValues = new Map<string, string>();

vi.mock("expo-secure-store", () => ({
  isAvailableAsync: vi.fn(async () => false),
  setItemAsync: vi.fn(),
  getItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    setItem: vi.fn(async (key: string, value: string) => { asyncValues.set(key, value); }),
    getItem: vi.fn(async (key: string) => asyncValues.get(key) ?? null),
    removeItem: vi.fn(async (key: string) => { asyncValues.delete(key); }),
  },
}));

describe("PokéBeat - almacenamiento Spotify compatible", () => {
  beforeEach(() => asyncValues.clear());

  it("guarda y recupera tokens sin llamar una API ausente de SecureStore", async () => {
    const storage = await import("../lib/secure-storage");
    await storage.setProtectedItem("spotify.test", "token");
    await expect(storage.getProtectedItem("spotify.test")).resolves.toBe("token");
    await storage.deleteProtectedItem("spotify.test");
    await expect(storage.getProtectedItem("spotify.test")).resolves.toBeNull();
  });
});
