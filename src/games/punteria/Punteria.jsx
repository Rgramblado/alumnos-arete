import { useEffect, useRef, useState } from 'react'
import './Punteria.css'

const DURACION = 30000 // 30 segundos
const MAX_BLANCOS = 5
const PROB_BOMBA = 0.16
const VALOR_ACIERTO = 10
const PENA_BOMBA = 15

// Dificultad segun progreso (0..1)
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
  const [flash, setFlash] = useState(null) // hit | bomb

  const finRef = useRef(0)
  const proxSpawnRef = useRef(0)
  const idRef = useRef(0)
  const loopRef = useRef(0)
  const blancosRef = useRef([]) // fuente autoritativa durante la partida
  const fallosRef = useRef(0)

  const flashear = (tipo) => {
    setFlash(tipo)
    setTimeout(() => setFlash(null), 120)
  }

  const empezar = () => {
    blancosRef.current = []
    fallosRef.current = 0
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

  useEffect(() => {
    if (estado !== 'jugando') return

    loopRef.current = setInterval(() => {
      const ahora = performance.now()
      const restante = Math.max(0, finRef.current - ahora)
      const p = 1 - restante / DURACION
      setSegundos(Math.ceil(restante / 1000))

      if (restante <= 0) {
        clearInterval(loopRef.current)
        blancosRef.current = []
        setBlancos([])
        setFallos(fallosRef.current)
        setEstado('fin')
        return
      }

      let vivos = blancosRef.current

      // Expirar (las dianas no acertadas cuentan como fallo)
      const expirados = vivos.filter((b) => ahora > b.nace + b.vida)
      if (expirados.length) {
        fallosRef.current += expirados.filter((b) => b.tipo === 'diana').length
        vivos = vivos.filter((b) => ahora <= b.nace + b.vida)
      }

      // Spawn
      if (ahora >= proxSpawnRef.current && vivos.length < MAX_BLANCOS) {
        const esBomba = Math.random() < PROB_BOMBA
        vivos = [
          ...vivos,
          {
            id: ++idRef.current,
            tipo: esBomba ? 'bomba' : 'diana',
            x: 6 + Math.random() * 82,
            y: 6 + Math.random() * 80,
            tam: 46 + Math.random() * 26,
            nace: ahora,
            vida: vidaBlanco(p),
          },
        ]
        proxSpawnRef.current = ahora + intervaloSpawn(p)
      }

      blancosRef.current = vivos
      setBlancos(vivos)
    }, 90)

    return () => clearInterval(loopRef.current)
  }, [estado])

  const golpear = (b, e) => {
    e.stopPropagation()
    blancosRef.current = blancosRef.current.filter((x) => x.id !== b.id)
    setBlancos(blancosRef.current)
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
        <span className="aim__hud-item">TIEMPO {segundos}</span>
        <span className="aim__hud-item">PUNTOS {puntos}</span>
        <span className="aim__hud-item">OK {aciertos}</span>
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
            <p className="aim__big">TIEMPO!</p>
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
