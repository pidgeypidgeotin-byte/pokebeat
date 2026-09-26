# PokéBeat — MVP funcional

PokéBeat es un juego móvil de mascotas virtuales original, inspirado en juegos de colección, donde escuchar música impulsa la progresión de Lumi.

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
- OAuth oficial de Spotify preparado en `lib/spotify.ts`.

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
4. Completa el intercambio seguro del código OAuth en el backend antes de usar tokens reales.

La app no descarga canciones ni extrae audio. Solo está preparada para consultar los endpoints oficiales permitidos. Spotify puede limitar la lectura del estado de reproducción según la cuenta, el dispositivo y los permisos vigentes.

## Próximas fases

- Intercambio PKCE y almacenamiento seguro del token.
- Polling controlado del estado actual de Spotify.
- Crianza, evoluciones, minijuegos y combate local.
- SQLite/Room mediante una capa nativa si se requiere una compilación Android dedicada.
- Assets originales adicionales y accesibilidad completa.
