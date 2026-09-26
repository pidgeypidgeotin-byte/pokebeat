import { describe, expect, it } from "vitest";

const REDIRECT_URI = "pokebeat://oauth/callback";

// Comprueba que el Client ID configurado es reconocido por el endpoint oficial
// sin iniciar sesión ni exponer un Client Secret.
describe("PokéBeat - configuración Spotify", () => {
  it("acepta el Client ID en el endpoint oficial de autorización", async () => {
    const clientId = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID;
    expect(clientId).toMatch(/^[a-f0-9]{32}$/i);

    const url = new URL("https://accounts.spotify.com/authorize");
    url.searchParams.set("client_id", clientId!);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("redirect_uri", REDIRECT_URI);
    url.searchParams.set("scope", "user-read-currently-playing");
    url.searchParams.set("state", "pokebeat-test-state");

    const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(8_000) });
    expect([200, 301, 302, 303, 307, 308]).toContain(response.status);
  }, 12_000);
});
