# Créditos y licencias — PokéBeat

## Sprite de Pikachu

- **Asset:** `assets/sprites/pikachu-idle.png`
- **Fuente:** [PMD Sprite Repository](https://sprites.pmdcollab.org/)
- **Repositorio:** [PMDCollab/SpriteCollab](https://github.com/PMDCollab/SpriteCollab)
- **Ruta de origen:** `sprite/0025/Idle-Anim.png`
- **Registro de créditos:** `assets/sprites/pikachu-credits.txt`
- **Autor indicado por el registro:** CHUNSOFT / registro CUR, según el archivo de créditos publicado por el repositorio.
- **Condición de uso:** El README oficial del repositorio indica que el material puede copiarse, redistribuirse, transformarse y reutilizarse para trabajos no comerciales siempre que se otorgue crédito apropiado; remite a **CC BY-NC 4.0**.
- **Fecha de consulta:** 2026-09-26.

## Nota de propiedad intelectual

PokéBeat es un proyecto independiente/no oficial. No utiliza logotipos oficiales, no incluye monetización ni compras con dinero real y no debe presentarse como producto de Nintendo, The Pokémon Company o Spotify.

## Reemplazo de assets

La arquitectura mantiene el sprite en `assets/sprites/` y lo carga desde `components/creature-orb.tsx`. Para reemplazarlo por una criatura original, sustituir el PNG y actualizar este archivo sin cambiar la lógica de progresión.
