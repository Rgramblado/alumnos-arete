import { Link } from 'react-router-dom'
import './GameShell.css'

export default function GameShell({ titulo, color, children }) {
  return (
    <div className="shell">
      <header className="shell__bar">
        <Link to="/" className="shell__back" aria-label="Volver a la ruleta">
          ← RULETA
        </Link>
        <h1 className="shell__title" style={{ color: color || 'var(--ink)' }}>
          {titulo}
        </h1>
        <span className="shell__spacer" aria-hidden="true" />
      </header>
      <main className="shell__stage">{children}</main>
    </div>
  )
}
