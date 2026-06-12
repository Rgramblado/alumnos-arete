import { lazy } from 'react'

// Registro de componentes jugables.
// Conforme se construye cada juego, se descomenta/añade su línea aquí
// y se pone `disponible: true` en src/data/games.js.

export const COMPONENTES = {
  punteria: lazy(() => import('./punteria/Punteria.jsx')),
}
