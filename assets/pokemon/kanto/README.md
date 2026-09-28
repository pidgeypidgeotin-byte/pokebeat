# PokéBeat Kanto assets

Each folder is zero-padded to the Kanto Pokédex number (`001`–`151`).

- `idle.png` and `walk.png` for `001`–`101` are PMDCollab SpriteCollab sheets bundled for non-commercial use with CC BY-NC 4.0 attribution.
- `102`–`151` currently use local PokeAPI static fallbacks because SpriteCollab had no published sheets for those species at the time of integration. They are deliberately stored in the same folder contract so they can be replaced without code changes.
- The Android overlay resources mirror these files as `pmd_0001.png` … `pmd_0151.png`.
