import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { JUEGOS } from '../data/games.js'
import './Ruleta.css'

const N = JUEGOS.length
const SEG = 360 / N
const CX = 200
const CY = 200
const R = 180
const V0 = 320 // velocidad constante de giro (grados/seg)

const prefiereSinMovimiento = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Punto en circunferencia: 0 grados arriba, sentido horario.
function punto(anguloDeg, r = R) {
  const rad = (anguloDeg * Math.PI) / 180
  return [CX + r * Math.sin(rad), CY - r * Math.cos(rad)]
}

function sliceParaIndice(i) {
  const [x1, y1] = punto(i * SEG)
  const [x2, y2] = punto((i + 1) * SEG)
  return `M ${CX} ${CY} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`
}

export default function Ruleta() {
  const navigate = useNavigate()
  const grupoRef = useRef(null)
  const rafRef = useRef(0)
  const lastRef = useRef(0)
  const anguloRef = useRef(0)
  const velRef = useRef(V0)
  const decelRef = useRef(0)
  const faseRef = useRef('girando') // girando | frenando | parado

  const [resultado, setResultado] = useState(null)
  const [parando, setParando] = useState(false)

  const aplicarRotacion = useCallback(() => {
    if (grupoRef.current) {
      grupoRef.current.setAttribute(
        'transform',
        `rotate(${anguloRef.current.toFixed(2)} ${CX} ${CY})`
      )
    }
  }, [])

  const resolverGanador = useCallback(() => {
    const ang = ((anguloRef.current % 360) + 360) % 360
    const local = (360 - ang) % 360
    const idx = Math.floor(local / SEG) % N
    setResultado(JUEGOS[idx])
    setParando(false)
  }, [])

  const iniciarBucle = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    lastRef.current = 0
    const tick = (t) => {
      if (!lastRef.current) lastRef.current = t
      const dt = Math.min((t - lastRef.current) / 1000, 0.05)
      lastRef.current = t

      if (faseRef.current === 'girando') {
        anguloRef.current += V0 * dt
      } else if (faseRef.current === 'frenando') {
        velRef.current = Math.max(0, velRef.current - decelRef.current * dt)
        anguloRef.current += velRef.current * dt
        if (velRef.current <= 0.5) {
          faseRef.current = 'parado'
          aplicarRotacion()
          resolverGanador()
          return // detener bucle
        }
      }
      aplicarRotacion()
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [aplicarRotacion, resolverGanador])

  useEffect(() => {
    if (prefiereSinMovimiento()) return
    iniciarBucle()
    return () => cancelAnimationFrame(rafRef.current)
  }, [iniciarBucle])

  const parar = () => {
    if (faseRef.current !== 'girando' || resultado) return

    if (prefiereSinMovimiento()) {
      const idx = Math.floor(Math.random() * N)
      anguloRef.current = (360 - (idx * SEG + SEG / 2) + 360) % 360
      aplicarRotacion()
      setResultado(JUEGOS[idx])
      return
    }

    const T = 2 + Math.random() // entre 2 y 3 segundos
    decelRef.current = velRef.current / T
    faseRef.current = 'frenando'
    setParando(true)
  }

  const girarOtraVez = () => {
    setResultado(null)
    setParando(false)
    velRef.current = V0
    faseRef.current = 'girando'
    if (!prefiereSinMovimiento()) iniciarBucle()
  }

  const jugar = () => {
    if (resultado) navigate(`/${resultado.slug}`)
  }

  return (
    <div className="ruleta">
      <h1 className="ruleta__logo">
        <span className="ruleta__logo-arcade">ARCADE</span>
        <span className="ruleta__logo-arete">ARETÉ</span>
      </h1>
      <p className="ruleta__sub">TOCA PARA PARAR LA RULETA</p>

      <div className="ruleta__caja">
        <div className="ruleta__puntero" aria-hidden="true" />
        <svg
          className="ruleta__svg"
          viewBox="0 0 400 400"
          role="img"
          aria-label="Ruleta de juegos"
          onClick={parar}
        >
          <circle cx={CX} cy={CY} r={R + 6} fill="#0a0118" stroke="#fff" strokeWidth="4" />
          <g ref={grupoRef}>
            {JUEGOS.map((j, i) => {
              const [mx, my] = punto((i + 0.5) * SEG, R * 0.66)
              return (
                <g key={j.slug}>
                  <path d={sliceParaIndice(i)} fill={j.color} stroke="#0a0118" strokeWidth="3" />
                  <text x={mx} y={my} fontSize="30" textAnchor="middle" dominantBaseline="central">
                    {j.icono}
                  </text>
                </g>
              )
            })}
          </g>
          <circle cx={CX} cy={CY} r="34" fill="#0a0118" stroke="#fff" strokeWidth="4" />
          <text x={CX} y={CY} fontSize="26" textAnchor="middle" dominantBaseline="central">
            🎲
          </text>
        </svg>
      </div>

      {!resultado && (
        <button className="px-btn px-btn--accent ruleta__parar" onClick={parar} disabled={parando}>
          {parando ? 'FRENANDO...' : 'PARAR'}
        </button>
      )}

      {resultado && (
        <div className="ruleta__panel" role="dialog" aria-live="polite">
          <div className="ruleta__panel-icono">{resultado.icono}</div>
          <div className="ruleta__panel-nombre" style={{ color: resultado.color }}>
            {resultado.nombre}
          </div>
          {resultado.disponible ? (
            <button className="px-btn px-btn--accent" onClick={jugar}>
              ¡JUGAR!
            </button>
          ) : (
            <div className="ruleta__panel-pronto">🚧 PRÓXIMAMENTE</div>
          )}
          <button className="px-btn ruleta__otra" onClick={girarOtraVez}>
            GIRAR OTRA VEZ
          </button>
        </div>
      )}
    </div>
  )
}
