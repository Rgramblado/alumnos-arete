import { useEffect, useRef, useState, useCallback } from 'react'
import './Flappy.css'

const W = 360
const H = 520
const GROUND = 48
const GRAVITY = 0.5
const FLAP = -8
const PIPE_W = 58
const GAP = 145
const PIPE_SPEED = 2.4
const PIPE_DIST = 210 // separación horizontal entre tubos
const BIRD_X = 92
const BIRD_W = 30
const BIRD_H = 24
const REC_KEY = 'arcade_flappy_record'

export default function Flappy() {
  const canvasRef = useRef(null)
  const faseRef = useRef('listo') // listo | jugando | fin
  const yRef = useRef(H / 2)
  const vyRef = useRef(0)
  const tubosRef = useRef([])
  const puntosRef = useRef(0)
  const recordRef = useRef(0)
  const rafRef = useRef(0)
  const lastRef = useRef(0)
  const aleteoRef = useRef(0) // para animar el ala

  const [fase, setFase] = useState('listo')
  const [puntos, setPuntos] = useState(0)
  const [record, setRecord] = useState(0)

  // Cargar récord guardado
  useEffect(() => {
    const r = parseInt(localStorage.getItem(REC_KEY) || '0', 10)
    recordRef.current = Number.isNaN(r) ? 0 : r
    setRecord(recordRef.current)
  }, [])

  const nuevoTubo = (x) => {
    const margen = 50
    const gapY = margen + Math.random() * (H - GROUND - GAP - margen * 2)
    return { x, gapY, pasado: false }
  }

  const reiniciar = useCallback(() => {
    yRef.current = H / 2
    vyRef.current = FLAP
    tubosRef.current = [nuevoTubo(W + 40), nuevoTubo(W + 40 + PIPE_DIST)]
    puntosRef.current = 0
    setPuntos(0)
    faseRef.current = 'jugando'
    setFase('jugando')
  }, [])

  const finPartida = useCallback(() => {
    faseRef.current = 'fin'
    setFase('fin')
    if (puntosRef.current > recordRef.current) {
      recordRef.current = puntosRef.current
      localStorage.setItem(REC_KEY, String(recordRef.current))
      setRecord(recordRef.current)
    }
    setPuntos(puntosRef.current)
  }, [])

  const entrada = useCallback(() => {
    if (faseRef.current === 'listo') reiniciar()
    else if (faseRef.current === 'jugando') vyRef.current = FLAP
    else if (faseRef.current === 'fin') reiniciar()
  }, [reiniciar])

  // Dibujo
  const dibujar = useCallback((ctx) => {
    // fondo
    ctx.fillStyle = '#0a0118'
    ctx.fillRect(0, 0, W, H)
    // estrellas
    ctx.fillStyle = '#2a1052'
    for (let i = 0; i < 28; i++) {
      const sx = (i * 53) % W
      const sy = (i * 97) % (H - GROUND)
      ctx.fillRect(sx, sy, 3, 3)
    }

    // tubos
    tubosRef.current.forEach((t) => {
      ctx.fillStyle = '#3ddc84'
      ctx.fillRect(t.x, 0, PIPE_W, t.gapY)
      ctx.fillRect(t.x, t.gapY + GAP, PIPE_W, H - GROUND - (t.gapY + GAP))
      // bordes/labios
      ctx.fillStyle = '#2ba85f'
      ctx.fillRect(t.x - 4, t.gapY - 18, PIPE_W + 8, 18)
      ctx.fillRect(t.x - 4, t.gapY + GAP, PIPE_W + 8, 18)
      ctx.fillStyle = '#1a0838'
      ctx.fillRect(t.x, 0, 4, t.gapY)
      ctx.fillRect(t.x, t.gapY + GAP, 4, H - GROUND - (t.gapY + GAP))
    })

    // suelo
    ctx.fillStyle = '#15052e'
    ctx.fillRect(0, H - GROUND, W, GROUND)
    ctx.fillStyle = '#2a1052'
    for (let x = 0; x < W; x += 16) ctx.fillRect(x, H - GROUND, 8, 6)

    // pájaro
    const by = yRef.current
    const subiendo = vyRef.current < 0
    ctx.fillStyle = '#ffd23f'
    ctx.fillRect(BIRD_X, by, BIRD_W, BIRD_H)
    // ala
    ctx.fillStyle = '#ff8c42'
    const alaY = subiendo ? by + 4 : by + 12
    ctx.fillRect(BIRD_X - 4, alaY, 10, 8)
    // pico
    ctx.fillStyle = '#ff5da2'
    ctx.fillRect(BIRD_X + BIRD_W, by + 8, 8, 7)
    // ojo
    ctx.fillStyle = '#0a0118'
    ctx.fillRect(BIRD_X + BIRD_W - 9, by + 5, 5, 5)

    // puntuación durante el juego
    if (faseRef.current === 'jugando') {
      ctx.fillStyle = '#fff'
      ctx.font = '24px "Press Start 2P", monospace'
      ctx.textAlign = 'center'
      ctx.fillText(String(puntosRef.current), W / 2, 54)
    }
  }, [])

  // Bucle principal
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false

    const loop = (t) => {
      if (!lastRef.current) lastRef.current = t
      const dt = Math.min((t - lastRef.current) / 16.6667, 2.5) // factor 60fps, cap
      lastRef.current = t

      if (faseRef.current === 'jugando') {
        vyRef.current += GRAVITY * dt
        yRef.current += vyRef.current * dt

        // techo
        if (yRef.current < 0) {
          yRef.current = 0
          vyRef.current = 0
        }
        // suelo
        if (yRef.current + BIRD_H >= H - GROUND) {
          yRef.current = H - GROUND - BIRD_H
          finPartida()
        }

        // mover y reciclar tubos
        tubosRef.current.forEach((tubo) => {
          tubo.x -= PIPE_SPEED * dt
          if (!tubo.pasado && tubo.x + PIPE_W < BIRD_X) {
            tubo.pasado = true
            puntosRef.current += 1
          }
        })
        if (tubosRef.current[0] && tubosRef.current[0].x + PIPE_W < -10) {
          tubosRef.current.shift()
          const ultimo = tubosRef.current[tubosRef.current.length - 1]
          tubosRef.current.push(nuevoTubo(ultimo.x + PIPE_DIST))
        }

        // colisión con tubos
        const bx = BIRD_X
        const by = yRef.current
        for (const tubo of tubosRef.current) {
          const enX = bx + BIRD_W > tubo.x && bx < tubo.x + PIPE_W
          if (enX) {
            const chocaArriba = by < tubo.gapY
            const chocaAbajo = by + BIRD_H > tubo.gapY + GAP
            if (chocaArriba || chocaAbajo) {
              finPartida()
              break
            }
          }
        }
      } else if (faseRef.current === 'listo') {
        // flotar suavemente
        aleteoRef.current += 0.06 * dt
        yRef.current = H / 2 + Math.sin(aleteoRef.current) * 8
      }

      dibujar(ctx)
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [dibujar, finPartida])

  // Teclado
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault()
        entrada()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [entrada])

  return (
    <div className="flappy">
      <div className="flappy__hud">
        <span className="flappy__hud-item">RÉCORD {record}</span>
      </div>

      <div className="flappy__marco" onPointerDown={entrada}>
        <canvas ref={canvasRef} width={W} height={H} className="flappy__canvas" />

        {fase === 'listo' && (
          <div className="flappy__overlay">
            <p className="flappy__big">FLAPPY</p>
            <p className="flappy__rule">Toca o pulsa ESPACIO para volar</p>
            <p className="flappy__rule">Esquiva los tubos</p>
            <p className="flappy__tap">▶ TOCA PARA EMPEZAR</p>
          </div>
        )}

        {fase === 'fin' && (
          <div className="flappy__overlay">
            <p className="flappy__big flappy__big--ko">¡PUM!</p>
            <div className="flappy__stats">
              <div>PUNTOS <b>{puntos}</b></div>
              <div>RÉCORD <b>{record}</b></div>
            </div>
            <p className="flappy__tap">▶ TOCA PARA REPETIR</p>
          </div>
        )}
      </div>
    </div>
  )
}
