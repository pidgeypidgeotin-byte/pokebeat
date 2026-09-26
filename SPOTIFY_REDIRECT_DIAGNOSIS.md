# Diagnóstico del error `redirect_uri: Not matching configuration`

## Causa

PokéBeat usa Authorization Code with PKCE, que es el flujo recomendado por Spotify para aplicaciones móviles y aplicaciones web públicas. Spotify exige que el valor de `redirect_uri` coincida exactamente con una URI incluida en la allowlist de la aplicación, incluyendo esquema, dominio, ruta, mayúsculas y barras finales.

La prueba actual se está haciendo en Chrome mediante el preview web. En esa plataforma la URI es:

```text
https://8081-iykq1bvpibp19nz3ikisv-9e20bcfb.us1.manus.computer/oauth/callback
```

La URI Android configurada es:

```text
pokebeat://oauth/callback
```

Estas dos URI no son intercambiables. `pokebeat://oauth/callback` abre una aplicación instalada que declara el esquema `pokebeat`; Chrome no puede completar el callback hacia el preview web con esa URI. El preview web necesita su propia URI HTTPS registrada.

## Solución

### Para probar desde Chrome

Agregar exactamente esta URI en Spotify Developer Dashboard > Edit settings > Redirect URIs:

```text
https://8081-iykq1bvpibp19nz3ikisv-9e20bcfb.us1.manus.computer/oauth/callback
```

Después guardar, volver a cargar PokéBeat y pulsar Conectar Spotify.

### Para probar una APK o development build Android

Conservar esta URI:

```text
pokebeat://oauth/callback
```

En ese caso se debe abrir la aplicación Android instalada, no el preview web de Chrome.

## Reglas oficiales relevantes

- Spotify exige coincidencia exacta del `redirect_uri` entre la solicitud de autorización, la allowlist y el intercambio del código.
- Spotify sigue permitiendo esquemas personalizados para aplicaciones móviles.
- Spotify exige HTTPS para redirects web no-loopback; las URI HTTP/localhost antiguas ya no son una solución válida.
- Expo requiere un development build o una aplicación instalada para que un esquema personalizado como `pokebeat://` pueda abrir la app.

Fuentes:

- https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow
- https://developer.spotify.com/documentation/web-api/concepts/apps
- https://developer.spotify.com/blog/2025-02-12-increasing-the-security-requirements-for-integrating-with-spotify
- https://developer.spotify.com/blog/2025-10-14-reminder-oauth-migration-27-nov-2025
- https://docs.expo.dev/linking/into-your-app/
