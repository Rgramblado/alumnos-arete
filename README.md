# ARCADE Areté

Arcade de minijuegos con ruleta de entrada. React + Vite. Estética pixel-art.

## Cómo funciona

Al entrar (`/`), una ruleta gira a velocidad constante. Al tocar, frena con física
de fricción y se detiene en 2-3 segundos sobre un juego. Cada juego tiene además su
propia ruta directa para poder probarlo sin pasar por la ruleta.

## Rutas

| Ruta | Contenido |
|------|-----------|
| `/` | Ruleta |
| `/punteria` | Puntería (reflejos) |
| `/buscaminas` | Buscaminas |
| `/flappy` | Flappy |
| `/dino` | Dino |
| `/conecta4` | 4 en raya |
| `/tetris` | Tetris |
| `/blockblast` | Block Blast |
| `/sudoku` | Sudoku de objetos |
| `/tartas` | Lanzamiento de tartas |

Los juegos aún no construidos muestran "Próximamente".

## Desarrollo

```bash
npm install
npm run dev
```

## Añadir un juego

1. Crear el componente en `src/games/<slug>/`.
2. Registrarlo en `src/games/registry.js`.
3. Poner `disponible: true` en `src/data/games.js`.

## Estado por sprint

- **v0.1 (Sprint 0):** scaffolding + router + ruleta. Sin juegos.
