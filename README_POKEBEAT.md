# PokéBeat — MVP ampliado para Android

PokéBeat es un juego móvil de mascotas virtuales original, inspirado en juegos de colección, donde escuchar música impulsa la progresión de Pikachu/Lumi.

## Incluido en esta primera versión

- Mascota original interactiva con animación, estados de ánimo y diálogos.
- XP musical, niveles sin tope práctico pequeño, subida de nivel y fórmula configurable.
- PKC y PKD persistentes en el dispositivo.
- EV normales con límites tradicionales y EV musicales independientes y aleatorios.
- Artista favorito con bonificación configurable.
- Inventario, Shiny Charm temporal y ficha de IVs/EVs.
- Misiones diarias, semanales y mensuales con recompensas reclamables.
- Modo de prueba de escucha para validar el bucle central sin descargar ni extraer audio.
- Persistencia local con AsyncStorage.
- Pantallas Inicio, Música, Colección y Misiones.
- Sprite de Pikachu integrado desde PMDCollab y créditos incluidos en el proyecto.
- Zona **Jugar** con entrenamiento EV normal, minijuegos de reflejos/memoria/carrera, crianza normal y Método Masuda, incubación por minutos, evolución Pikachu → Raichu, combate básico contra NPC y personalización de Poké Ball.
- Límite anti-abuso básico: máximo 60 minutos aceptados por evento y 360 minutos por día local.
- Stats reales de Pichu, Pikachu y Raichu; cálculo de HP/ATK/DEF/SPA/SPD/SPE por nivel, IVs, EVs normales y EVs musicales.
- OAuth PKCE real en `lib/spotify.ts`, SecureStore, refresh token y lectura de reproducción actual.
- Servicio foreground Android y overlay `TYPE_APPLICATION_OVERLAY` arrastrable con permiso explícito.

## Ejecutar

```bash
pnpm install
pnpm dev
```

Para Android:

```bash
pnpm android
```

Para comprobar tipos:

```bash
pnpm check
```

## Configuración de Spotify

1. Crea una aplicación en [Spotify for Developers](https://developer.spotify.com/dashboard).
2. Añade la URI de redirección `pokebeat://oauth/callback`.
3. Define `EXPO_PUBLIC_SPOTIFY_CLIENT_ID` en el entorno de Expo.
4. Pulsa **Conectar Spotify**. La app usa Authorization Code with PKCE, guarda tokens en SecureStore, renueva el access token y consulta `/v1/me/player/currently-playing` cada 20 segundos mientras Música está activa.

La app maneja 204 (sin reproducción), 401, 403 y 429 sin inventar datos. No descarga canciones, no extrae audio y no sincroniza/broadcast audio. Para el modo overlay se debe añadir polling respetuoso de rate limits desde el servicio foreground; el overlay ya está preparado, pero no debe consultar Spotify agresivamente.

## Assets y créditos

El sprite de Pikachu usado en esta base proviene de [PMDCollab Sprite Repository](https://sprites.pmdcollab.org/), archivo `sprite/0025/Idle-Anim.png`. El registro asociado se conserva en `assets/sprites/pikachu-credits.txt`. El repositorio indica uso no comercial con atribución bajo CC BY-NC 4.0; PokéBeat no es un producto oficial de Nintendo ni de The Pokémon Company.

## Próximas fases

- Polling de Spotify desde el servicio foreground nativo, sujeto a límites de rate.
- Cuenta real del usuario y `user-top-read` para elegir artista favorito con variación.
- SQLite/Room mediante una capa nativa si se requiere una compilación Android dedicada.
- Assets originales adicionales y accesibilidad completa.
