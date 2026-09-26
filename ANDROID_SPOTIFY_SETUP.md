# Configuración de Spotify y mascota persistente

## Spotify real

Registra una app en Spotify for Developers y añade exactamente `pokebeat://oauth/callback`. Define `EXPO_PUBLIC_SPOTIFY_CLIENT_ID` antes de compilar. La app usa Authorization Code with PKCE: el client secret no se incluye en la APK. Se solicitan `user-read-currently-playing`, `user-read-playback-state`, `user-read-recently-played`, `user-top-read` y `user-read-private`.

Al autorizar, `lib/spotify.ts` guarda el access token y refresh token en `expo-secure-store`, renueva el token cuando faltan menos de 60 segundos para expirar y consulta `GET /v1/me/player/currently-playing`. Música sincroniza cada 20 segundos mientras está visible y solo convierte intervalos monotónicos del mismo track en minutos de progresión. Un 204 significa que no hay reproducción activa.

## Mascota fuera de la app

En Android, abre Inicio y pulsa **Conceder permiso** en “Mascota persistente”. Activa **Mostrar sobre otras aplicaciones** para PokéBeat. Regresa a la app y pulsa **Mostrar fuera de la app**.

El módulo `modules/pet-overlay` inicia `PetOverlayService` como foreground service con una notificación persistente y una ventana overlay arrastrable que se puede tocar para volver a PokéBeat. Puedes ocultarla con **Ocultar mascota** o detener el servicio desde la notificación/sistema.

Android 15/16 restringe arrancar foreground services desde background. Por eso el servicio se inicia como consecuencia directa de una acción visible del usuario y mantiene el canal de notificación de baja prioridad. Si el usuario no concede el permiso especial, no se dibuja sobre otras apps.

## Compilación nativa

```bash
pnpm install
npx expo prebuild --platform android
cd android
./gradlew assembleDebug
```

La APK aparece en `android/app/build/outputs/apk/debug/app-debug.apk`. Este sandbox no incluye Android SDK/emulador, por lo que la prueba final debe hacerse en Android Studio o en un dispositivo Android 16.
