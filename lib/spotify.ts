import * as Crypto from "expo-crypto";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

import { deleteProtectedItem, getProtectedItem, setProtectedItem } from "@/lib/secure-storage";

const CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID ?? "";
const TOKEN_KEY = "pokebeat.spotify.tokens.v1";
const VERIFIER_KEY = "pokebeat.spotify.pkce.verifier";
const STATE_KEY = "pokebeat.spotify.pkce.state";
const API_BASE = "https://api.spotify.com/v1";
const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
const SCOPES = [
  "user-read-currently-playing",
  "user-read-playback-state",
  "user-read-recently-played",
  "user-top-read",
  "user-read-private",
].join(" ");

export type SpotifyPlayback = {
  isPlaying: boolean;
  progressMs: number;
  track: string;
  artist: string;
  album: string;
  durationMs: number;
  trackId: string | null;
};

type SpotifyTokens = { accessToken: string; refreshToken?: string; expiresAt: number; scope?: string };

async function randomString(length: number) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const bytes = await Crypto.getRandomBytesAsync(length);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

async function createPkcePair() {
  const verifier = await randomString(64);
  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier, { encoding: Crypto.CryptoEncoding.BASE64 });
  const challenge = digest.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return { verifier, challenge };
}

function getClientId() {
  return CLIENT_ID.trim();
}

export function getSpotifyRedirectUri() {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `${window.location.origin}/oauth/callback`;
  }
  return "pokebeat://oauth/callback";
}

export function isSpotifyConfigured() {
  return getClientId().length > 0;
}

async function saveTokens(tokens: SpotifyTokens) {
  await setProtectedItem(TOKEN_KEY, JSON.stringify(tokens));
}

async function readTokens() {
  const stored = await getProtectedItem(TOKEN_KEY);
  if (!stored) return null;
  try { return JSON.parse(stored) as SpotifyTokens; } catch { return null; }
}

async function exchangeCode(code: string, verifier: string) {
  const body = new URLSearchParams({
    client_id: getClientId(),
    grant_type: "authorization_code",
    code,
    redirect_uri: getSpotifyRedirectUri(),
    code_verifier: verifier,
  });
  const response = await fetch(TOKEN_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString() });
  if (!response.ok) throw new Error(`Spotify token exchange failed (${response.status})`);
  const payload = await response.json();
  await saveTokens({ accessToken: payload.access_token, refreshToken: payload.refresh_token, expiresAt: Date.now() + payload.expires_in * 1000, scope: payload.scope });
}

async function refreshTokens(tokens: SpotifyTokens) {
  if (!tokens.refreshToken) return null;
  const body = new URLSearchParams({ client_id: getClientId(), grant_type: "refresh_token", refresh_token: tokens.refreshToken });
  const response = await fetch(TOKEN_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString() });
  if (!response.ok) return null;
  const payload = await response.json();
  const nextTokens = { accessToken: payload.access_token, refreshToken: payload.refresh_token ?? tokens.refreshToken, expiresAt: Date.now() + payload.expires_in * 1000, scope: payload.scope ?? tokens.scope };
  await saveTokens(nextTokens);
  return nextTokens;
}

export async function getValidAccessToken() {
  const tokens = await readTokens();
  if (!tokens) return null;
  if (tokens.expiresAt > Date.now() + 60_000) return tokens.accessToken;
  const refreshed = await refreshTokens(tokens);
  return refreshed?.accessToken ?? null;
}

export async function startSpotifyOAuth(): Promise<{ ok: boolean; message: string; playback?: SpotifyPlayback }> {
  if (!isSpotifyConfigured()) return { ok: false, message: "REQUIERE CONFIGURACIÓN EXTERNA: define EXPO_PUBLIC_SPOTIFY_CLIENT_ID y registra exactamente pokebeat://oauth/callback en Spotify for Developers." };
  const { verifier, challenge } = await createPkcePair();
  const state = await randomString(32);
  await setProtectedItem(VERIFIER_KEY, verifier);
  await setProtectedItem(STATE_KEY, state);
  const params = new URLSearchParams({ client_id: getClientId(), response_type: "code", redirect_uri: getSpotifyRedirectUri(), scope: SCOPES, code_challenge_method: "S256", code_challenge: challenge, state, show_dialog: "true" });
  const result = await WebBrowser.openAuthSessionAsync(`https://accounts.spotify.com/authorize?${params.toString()}`, getSpotifyRedirectUri());
  if (result.type !== "success" || !result.url) return { ok: false, message: "Autorización cancelada o no completada." };
  const callback = new URL(result.url);
  const returnedState = callback.searchParams.get("state");
  const code = callback.searchParams.get("code");
  const expectedState = await getProtectedItem(STATE_KEY);
  const storedVerifier = await getProtectedItem(VERIFIER_KEY);
  if (!code || !storedVerifier || returnedState !== expectedState) return { ok: false, message: "Spotify rechazó el callback por código o state inválido." };
  try {
    await exchangeCode(code, storedVerifier);
    await deleteProtectedItem(VERIFIER_KEY);
    await deleteProtectedItem(STATE_KEY);
    return { ok: true, message: "Spotify conectado mediante OAuth PKCE." };
  } catch (error) {
    return { ok: false, message: `LIMITACIÓN DE API: no se pudo intercambiar el código de Spotify (${String(error)}).` };
  }
}

export async function fetchCurrentPlayback(): Promise<SpotifyPlayback | null> {
  const token = await getValidAccessToken();
  if (!token) return null;
  const response = await fetch(`${API_BASE}/me/player/currently-playing?market=ES&additional_types=track,episode`, { headers: { Authorization: `Bearer ${token}` } });
  if (response.status === 204) return null;
  if (!response.ok) {
    if (response.status === 401) await deleteProtectedItem(TOKEN_KEY);
    throw new Error(`Spotify playback request failed (${response.status})`);
  }
  const payload = await response.json();
  const item = payload.item;
  if (!item) return null;
  return { isPlaying: Boolean(payload.is_playing), progressMs: payload.progress_ms ?? 0, track: item.name ?? "Contenido actual", artist: item.artists?.map((artist: { name: string }) => artist.name).join(", ") ?? item.show?.name ?? "Artista desconocido", album: item.album?.name ?? item.show?.publisher ?? "", durationMs: item.duration_ms ?? 0, trackId: item.id ?? null };
}

export async function fetchSpotifyProfile(): Promise<{ displayName: string; id: string } | null> {
  const token = await getValidAccessToken();
  if (!token) return null;
  const response = await fetch(`${API_BASE}/me`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) return null;
  const payload = await response.json();
  return { displayName: payload.display_name ?? payload.id ?? "Cuenta Spotify", id: payload.id ?? "" };
}

export async function disconnectSpotify() {
  await deleteProtectedItem(TOKEN_KEY);
  await deleteProtectedItem(VERIFIER_KEY);
  await deleteProtectedItem(STATE_KEY);
}
