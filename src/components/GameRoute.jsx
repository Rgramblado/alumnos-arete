import { Suspense } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getJuego } from '../data/games.js'
import { COMPONENTES } from '../games/registry.js'
import GameShell from './GameShell.jsx'

export default function GameRoute() {
  const { slug } = useParams()
  const juego = getJuego(slug)

  // Slug que no existe en el catálogo.
  if (!juego) {
    return (
      <GameShell titulo="404">
        <div style={{ textAlign: 'center', lineHeight: 2 }}>
          <p style={{ fontSize: '0.7rem' }}>Ese juego no existe.</p>
          <Link to="/" className="px-btn" style={{ marginTop: 20 }}>
            VOLVER
          </Link>
        </div>
      </GameShell>
    )
  }

  const Componente = COMPONENTES[slug]

  // En el catálogo pero todavía sin construir.
  if (!Componente) {
    return (
      <GameShell titulo={juego.nombre} color={juego.color}>
        <div style={{ textAlign: 'center', lineHeight: 2 }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>{juego.icono}</div>
          <p style={{ fontSize: '0.7rem', color: 'var(--ink-dim)' }}>
            🚧 PRÓXIMAMENTE 🚧
          </p>
          <Link to="/" className="px-btn" style={{ marginTop: 24 }}>
            VOLVER
          </Link>
        </div>
      </GameShell>
    )
  }

  return (
    <GameShell titulo={juego.nombre} color={juego.color}>
      <Suspense fallback={<p style={{ fontSize: '0.7rem' }}>CARGANDO…</p>}>
        <Componente />
      </Suspense>
    </GameShell>
  )
}
