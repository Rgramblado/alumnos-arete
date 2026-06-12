// Catálogo de juegos del arcade.
// Fuente única de verdad: la ruleta y las rutas se generan desde aquí.
// En cada sprint, al terminar un juego, se pone `disponible: true`.

export const JUEGOS = [
  { slug: 'punteria',   nombre: 'PUNTERÍA',    icono: '🎯', color: '#ff3b6b', disponible: true },
  { slug: 'buscaminas', nombre: 'BUSCAMINAS',  icono: '💣', color: '#4f9bff', disponible: true },
  { slug: 'flappy',     nombre: 'FLAPPY',      icono: '🐤', color: '#ffd23f', disponible: false },
  { slug: 'dino',       nombre: 'DINO',        icono: '🦕', color: '#3ddc84', disponible: false },
  { slug: 'conecta4',   nombre: '4 EN RAYA',   icono: '🔴', color: '#ff6b35', disponible: false },
  { slug: 'tetris',     nombre: 'TETRIS',      icono: '🟦', color: '#a64dff', disponible: false },
  { slug: 'blockblast', nombre: 'BLOCK BLAST', icono: '🧱', color: '#ff8c42', disponible: false },
  { slug: 'sudoku',     nombre: 'SUDOKU',      icono: '🧩', color: '#2ec4b6', disponible: false },
  { slug: 'tartas',     nombre: 'TARTAS',      icono: '🥧', color: '#ff5da2', disponible: false },
]

export const getJuego = (slug) => JUEGOS.find((j) => j.slug === slug)
