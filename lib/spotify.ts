import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

const CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID ?? "";
const SCOPES = [
  "user-read-currently-playing",
  "user-read-playback-state",
  "user-read-recently-played",
  "user-top-read",
].join(" ");

export function getSpotifyRedirectUri() {
  return Linking.createURL("oauth/callback");
}

export function isSpotifyConfigured() {
  return CLIENT_ID.length > 0;
}

export async function startSpotifyOAuth(): Promise<{ ok: boolean; message: string; code?: string }> {
  if (!CLIENT_ID) {
    return { ok: false, message: "Falta EXPO_PUBLIC_SPOTIFY_CLIENT_ID. La app ya está preparada para OAuth, pero necesitas registrar tu aplicación en Spotify for Developers." };
  }
  const redirectUri = getSpotifyRedirectUri();
  const params = [
    ["client_id", CLIENT_ID],
    ["response_type", "code"],
    ["redirect_uri", redirectUri],
    ["scope", SCOPES],
    ["show_dialog", "true"],
  ].map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join("&");
  const result = await WebBrowser.openAuthSessionAsync(`https://accounts.spotify.com/authorize?${params}`, redirectUri);
  if (result.type !== "success" || !result.url) {
    return { ok: false, message: "Autorización cancelada o no completada." };
  }
  const code = new URL(result.url).searchParams.get("code");
  if (!code) return { ok: false, message: "Spotify no devolvió un código válido." };
  return { ok: true, code, message: "OAuth completado. Falta intercambiar el código de forma segura en el backend." };
}
