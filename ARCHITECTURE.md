# Arquitectura de PokéBeat

## Capas

- `app/`: navegación y pantallas Expo Router.
- `components/`: UI reutilizable, incluida la mascota animada.
- `lib/game-config.ts`: fórmulas y parámetros editables.
- `lib/game-store.tsx`: estado local, economía, XP, EVs, misiones y persistencia.
- `lib/spotify.ts`: OAuth oficial y URI de callback; no descarga ni extrae audio.
- `assets/sprites/`: assets con créditos conservados.

## Persistencia

La primera base local usa AsyncStorage para que el juego funcione offline. La forma de estado está separada de la UI para permitir migración posterior a Room/SQLite o sincronización en nube.

## Spotify: configuración externa requerida

- Registrar una app en Spotify for Developers.
- Añadir `pokebeat://oauth/callback` como Redirect URI.
- Definir `EXPO_PUBLIC_SPOTIFY_CLIENT_ID`.
- Implementar en backend el intercambio PKCE del código por tokens; el client secret nunca debe entrar en la APK.
- Consultar `GET /me/player`, `GET /me/player/currently-playing`, `GET /me/player/recently-played` y `GET /me/top/artists` solo con scopes permitidos.
- Spotify puede devolver ausencia de reproducción, estado incompleto o acceso limitado dependiendo de cuenta/dispositivo; la app debe mostrar “LIMITACIÓN DE API” en vez de inventar datos.

## Android 16

El proyecto usa Expo SDK 54 y React Native 0.81 con `compileSdk` controlado por Expo. Para una APK debug reproducible se debe abrir el proyecto en Android Studio con Android SDK/Gradle instalados, ejecutar `npx expo prebuild` y luego `./gradlew assembleDebug`.

## Seguridad anti-abuso pendiente de ampliación

El contador real debe aceptar solo intervalos monotónicos de reproducción, limitar saltos de reloj, aplicar una ventana máxima por sesión y persistir un hash/último timestamp. El MVP ya mantiene las fórmulas centralizadas; la validación de sesiones Spotify se incorpora en la siguiente fase.
