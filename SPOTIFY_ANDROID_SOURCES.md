# Fuentes oficiales consultadas

## Spotify

- OAuth PKCE: https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow
- Reproducción actual: https://developer.spotify.com/documentation/web-api/reference/get-the-users-currently-playing-track
- El flujo PKCE es el recomendado para aplicaciones móviles donde no se puede proteger un client secret. La implementación usa `code_verifier`, `code_challenge` S256, `state`, intercambio en `/api/token`, refresh token y almacenamiento seguro.
- La lectura actual usa `GET /v1/me/player/currently-playing` con el scope `user-read-currently-playing`, acepta `204 No Content`, lee canción, artista, álbum, progreso, duración y estado. La API puede responder 401, 403 o 429; la app no inventa datos si ocurre.
- Spotify prohíbe sincronizar o emitir contenido de audio; PokéBeat solo procesa metadatos y tiempo de reproducción permitido.

## Android

- Restricciones para iniciar foreground services: https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start
- Permiso `SYSTEM_ALERT_WINDOW`: https://developer.android.com/reference/android/Manifest.permission#SYSTEM_ALERT_WINDOW
- Android permite ventanas `TYPE_APPLICATION_OVERLAY` con `SYSTEM_ALERT_WINDOW`, pero exige permiso explícito del usuario. En Android 15+ el inicio desde background está restringido y un overlay visible es una condición relevante; Android 16 debe probarse en dispositivo real.
- La implementación prevista usa un servicio foreground nativo con notificación persistente y overlay opcional; si el usuario no concede overlay, se mantiene la mascota mediante notificación/acción y widget de inicio.
