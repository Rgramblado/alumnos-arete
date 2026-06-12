import { useEffect, useRef, useState, useCallback } from 'react'
import './Punteria.css'

const DURACION = 30000 // 30 segundos
const MAX_BLANCOS = 5
const PROB_BOMBA = 0.16
const VALOR_ACIERTO = 10
const PENA_BOMBA = 15

// Dificultad: intervalo de aparición y vida del blanco según progreso (0..1)
const intervaloSpawn = (p) => 720 - 320 * p // 720ms -> 400ms
const vidaBlanco = (p) => 1300 - 520 * p // 1300ms -> 780ms

export default function Punteria() {
  const [estado, setEstado] = useState('listo') // listo | jugando | fin
  const [blancos, setBlancos] = useState([])
  const [segundos, setSegundos] = useState(30)
  const [puntos, setPuntos] = useState(0)
  const [aciertos, setAciertos] = useState(0)
  const [fallos, setFallos] = useState(0)
  const [bombas, setBombas] = useState(0)
  const [flash, setFlash] = useState(null) // 'hit' | 'bomb'

  const finRef = useRef(0)
  const proxSpawnRef = useRef(0)
  const idRef = useRef(0)
  const loopRef = useRef(0)

  const flashear = useCallback((tipo) => {
    setFlash(tipo)
    setTimeout(() => setFlash(null), 120)
  }, [])

  const empezar = () => {
    setBlancos([])
    setPuntos(0)
    setAciertos(0)
    setFallos(0)
    setBombas(0)
    setSegundos(30)
    const ahora = performance.now()
    finRef.current = ahora + DURACION
    proxSpawnRef.current = ahora + 300
    idRef.current = 0
    setEstado('jugando')
  }

  // Bucle de juego (tick por intervalo, no por frame: basta para spawn/expirar)
  useEffect(() => {
    if (estado !== 'jugando') return

    loopRef.current = setInterval(() => {
      const ahora = performance.now()
      const restante = Math.max(0, finRef.current - ahora)
      const p = 1 - restante / DURACION
      setSegundos(Math.ceil(restante / 1000))

      if (restante <= 0) {
        clearInterval(loopRef.current)
        setBlancos([])
        setEstado('fin')
        return
      }

      setBlancos((prev) => {
        let vivos = prev
        // Expirar
        const expirados = vivos.filter((b) => ahora > b.nace + b.vida)
        if (expirados.length) {
          const fallosNuevos = expirados.filter((b) => b.tipo === 'diana').length
          if (fallosNuevos) setFallos((f) => f + fallosNuevos)
          vivos = vivos.filter((b) => ahora <= b.nace + b.vida)
        }
        // Spawn
        if (ahora >= proxSpawnRef.current && vivos.length < MAX_BLANCOS) {
          const esBomba = Math.random() < PROB_BOMBA
          const nuevo = {
            id: ++idRef.current,
            tipo: esBomba ? 'bomba' : 'diana',
            x: 6 + Math.random() * 82, // %
            y: 6 + Math.random() * 80, // %
            tam: 46 + Math.random() * 26, // px
            nace: ahora,
            vida: vidaBlanco(p),
          }
          vivos = [...vivos, nuevo]
          proxSpawnRef.current = ahora + intervaloSpawn(p)
        }
        return vivos
      })
    }, 90)

    return () => clearInterval(loopRef.current)
  }, [estado])

  const golpear = (b, e) => {
    e.stopPropagation()
    setBlancos((prev) => prev.filter((x) => x.id !== b.id))
    if (b.tipo === 'bomba') {
      setPuntos((s) => s - PENA_BOMBA)
      setBombas((n) => n + 1)
      flashear('bomb')
    } else {
      setPuntos((s) => s + VALOR_ACIERTO)
      setAciertos((a) => a + 1)
      flashear('hit')
    }
  }

  const precision =
    aciertos + fallos > 0 ? Math.round((aciertos / (aciertos + fallos)) * 100) : 0

  return (
    <div className="aim">
      <div className="aim__hud">
        <span className="aim__hud-item">⏱ {segundos}s</span>
        <span className="aim__hud-item">⭐ {puntos}</span>
        <span className="aim__hud-item">🎯 {aciertos}</span>
      </div>

      <div className={`aim__stage ${flash ? `aim__stage--${flash}` : ''}`}>
        {estado === 'listo' && (
          <div className="aim__overlay">
            <p className="aim__big">PUNTERÍA</p>
            <p className="aim__rule">Acierta dianas 🎯 · evita bombas 🧨</p>
            <p className="aim__rule">30 segundos</p>
            <button className="px-btn px-btn--accent" onClick={empezar}>
              EMPEZAR
            </button>
          </div>
        )}

        {estado === 'jugando' &&
          blancos.map((b) => (
            <button
              key={b.id}
              className={`aim__blanco aim__blanco--${b.tipo}`}
              style={{
                left: `${b.x}%`,
                top: `${b.y}%`,
                width: b.tam,
                height: b.tam,
                fontSize: b.tam * 0.62,
                animationDuration: `${b.vida}ms`,
              }}
              onPointerDown={(e) => golpear(b, e)}
              aria-label={b.tipo === 'bomba' ? 'bomba' : 'diana'}
            >
              {b.tipo === 'bomba' ? '🧨' : '🎯'}
            </button>
          ))}

        {estado === 'fin' && (
          <div className="aim__overlay">
            <p className="aim__big">¡TIEMPO!</p>
            <div className="aim__stats">
              <div>PUNTOS <b>{puntos}</b></div>
              <div>ACIERTOS <b>{aciertos}</b></div>
              <div>FALLOS <b>{fallos}</b></div>
              <div>BOMBAS <b>{bombas}</b></div>
              <div>PRECISIÓN <b>{precision}%</b></div>
            </div>
            <button className="px-btn px-btn--accent" onClick={empezar}>
              OTRA VEZ
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
