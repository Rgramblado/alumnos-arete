import { useEffect, useRef, useState } from 'react'
import './Buscaminas.css'

const DIFICULTADES = {
  facil: { nombre: 'FÁCIL', filas: 9, cols: 9, minas: 10 },
  medio: { nombre: 'MEDIO', filas: 13, cols: 13, minas: 28 },
  dificil: { nombre: 'DIFÍCIL', filas: 16, cols: 16, minas: 45 },
}

const COLOR_NUM = ['', '#4f9bff', '#3ddc84', '#ff5da2', '#a64dff', '#ff8c42', '#2ec4b6', '#ffd23f', '#ffffff']

function tableroVacio(filas, cols) {
  return Array.from({ length: filas }, () =>
    Array.from({ length: cols }, () => ({
      mina: false,
      descubierta: false,
      bandera: false,
      vecinas: 0,
    }))
  )
}

function vecinosDe(r, c, filas, cols) {
  const out = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const nr = r + dr
      const nc = c + dc
      if (nr >= 0 && nr < filas && nc >= 0 && nc < cols) out.push([nr, nc])
    }
  }
  return out
}

// Coloca minas evitando la casilla del primer clic y su entorno 3x3.
function colocarMinas(tab, filas, cols, minas, seguroR, seguroC) {
  const prohibidas = new Set([`${seguroR},${seguroC}`])
  vecinosDe(seguroR, seguroC, filas, cols).forEach(([r, c]) => prohibidas.add(`${r},${c}`))

  const candidatas = []
  for (let r = 0; r < filas; r++)
    for (let c = 0; c < cols; c++)
      if (!prohibidas.has(`${r},${c}`)) candidatas.push([r, c])

  // Si no caben con margen (tableros muy pequeños), solo se excluye la casilla.
  let pool = candidatas
  if (minas > candidatas.length) {
    pool = []
    for (let r = 0; r < filas; r++)
      for (let c = 0; c < cols; c++)
        if (!(r === seguroR && c === seguroC)) pool.push([r, c])
  }

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  pool.slice(0, minas).forEach(([r, c]) => {
    tab[r][c].mina = true
  })

  for (let r = 0; r < filas; r++) {
    for (let c = 0; c < cols; c++) {
      if (tab[r][c].mina) continue
      tab[r][c].vecinas = vecinosDe(r, c, filas, cols).filter(([nr, nc]) => tab[nr][nc].mina).length
    }
  }
  return tab
}

export default function Buscaminas() {
  const [dif, setDif] = useState(null)
  const [tab, setTab] = useState([])
  const [estado, setEstado] = useState('config') // config | jugando | ganado | perdido
  const [banderas, setBanderas] = useState(0)
  const [tiempo, setTiempo] = useState(0)
  const [modoBandera, setModoBandera] = useState(false)

  const primerClicRef = useRef(true)
  const timerRef = useRef(0)

  const elegir = (clave) => {
    const d = DIFICULTADES[clave]
    setDif(d)
    setTab(tableroVacio(d.filas, d.cols))
    setEstado('jugando')
    setBanderas(0)
    setTiempo(0)
    setModoBandera(false)
    primerClicRef.current = true
    clearInterval(timerRef.current)
  }

  const reset = () => dif && elegir(Object.keys(DIFICULTADES).find((k) => DIFICULTADES[k] === dif))

  const volverConfig = () => {
    clearInterval(timerRef.current)
    setEstado('config')
    setDif(null)
    setTab([])
  }

  useEffect(() => () => clearInterval(timerRef.current), [])

  const arrancarTimer = () => {
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => setTiempo((t) => t + 1), 1000)
  }

  const revelarFlood = (tab2, r, c, filas, cols) => {
    const pila = [[r, c]]
    while (pila.length) {
      const [cr, cc] = pila.pop()
      const celda = tab2[cr][cc]
      if (celda.descubierta || celda.bandera) continue
      celda.descubierta = true
      if (celda.vecinas === 0 && !celda.mina) {
        vecinosDe(cr, cc, filas, cols).forEach(([nr, nc]) => {
          if (!tab2[nr][nc].descubierta) pila.push([nr, nc])
        })
      }
    }
  }

  const comprobarVictoria = (tab2, filas, cols, minas) => {
    let descubiertas = 0
    for (let r = 0; r < filas; r++)
      for (let c = 0; c < cols; c++) if (tab2[r][c].descubierta) descubiertas++
    return descubiertas === filas * cols - minas
  }

  const tocar = (r, c) => {
    if (estado !== 'jugando') return
    if (modoBandera) return ponerBandera(r, c)

    const celda = tab[r][c]
    if (celda.bandera || celda.descubierta) return

    let tab2 = tab.map((fila) => fila.map((x) => ({ ...x })))
    const { filas, cols, minas } = dif

    if (primerClicRef.current) {
      colocarMinas(tab2, filas, cols, minas, r, c)
      primerClicRef.current = false
      arrancarTimer()
    }

    if (tab2[r][c].mina) {
      for (let i = 0; i < filas; i++)
        for (let j = 0; j < cols; j++) if (tab2[i][j].mina) tab2[i][j].descubierta = true
      setTab(tab2)
      setEstado('perdido')
      clearInterval(timerRef.current)
      return
    }

    revelarFlood(tab2, r, c, filas, cols)
    setTab(tab2)

    if (comprobarVictoria(tab2, filas, cols, minas)) {
      setEstado('ganado')
      clearInterval(timerRef.current)
    }
  }

  const ponerBandera = (r, c) => {
    if (estado !== 'jugando') return
    const celda = tab[r][c]
    if (celda.descubierta) return
    const tab2 = tab.map((fila) => fila.map((x) => ({ ...x })))
    tab2[r][c].bandera = !tab2[r][c].bandera
    setTab(tab2)
    setBanderas((b) => b + (tab2[r][c].bandera ? 1 : -1))
  }

  const clicDerecho = (e, r, c) => {
    e.preventDefault()
    ponerBandera(r, c)
  }

  // Pantalla de selección
  if (estado === 'config') {
    return (
      <div className="mina mina--config">
        <p className="mina__titulo">BUSCAMINAS</p>
        <p className="mina__sub">Elige dificultad</p>
        <div className="mina__dificultades">
          {Object.entries(DIFICULTADES).map(([clave, d]) => (
            <button key={clave} className="px-btn" onClick={() => elegir(clave)}>
              {d.nombre}
              <span className="mina__dificultad-info">
                {d.filas}×{d.cols} · {d.minas} 💣
              </span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const { filas, cols } = dif
  const minasRestantes = dif.minas - banderas
  const cara = estado === 'perdido' ? '💀' : estado === 'ganado' ? '😎' : '🙂'

  return (
    <div className="mina">
      <div className="mina__hud">
        <span className="mina__contador">💣 {minasRestantes}</span>
        <button className="mina__cara" onClick={reset} aria-label="Reiniciar">
          {cara}
        </button>
        <span className="mina__contador">⏱ {tiempo}</span>
      </div>

      <div
        className="mina__tablero"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, maxWidth: `min(92vw, ${cols * 38}px)` }}
      >
        {tab.map((fila, r) =>
          fila.map((celda, c) => {
            const clases = ['mina__celda']
            if (celda.descubierta) clases.push('mina__celda--abierta')
            if (celda.descubierta && celda.mina) clases.push('mina__celda--boom')
            let contenido = ''
            if (celda.bandera && !celda.descubierta) contenido = '🚩'
            else if (celda.descubierta && celda.mina) contenido = '💥'
            else if (celda.descubierta && celda.vecinas > 0) contenido = celda.vecinas
            return (
              <button
                key={`${r}-${c}`}
                className={clases.join(' ')}
                style={
                  celda.descubierta && celda.vecinas > 0 && !celda.mina
                    ? { color: COLOR_NUM[celda.vecinas] }
                    : undefined
                }
                onClick={() => tocar(r, c)}
                onContextMenu={(e) => clicDerecho(e, r, c)}
              >
                {contenido}
              </button>
            )
          })
        )}
      </div>

      <div className="mina__controles">
        <button
          className={`px-btn ${modoBandera ? 'px-btn--accent' : ''}`}
          onClick={() => setModoBandera((m) => !m)}
        >
          {modoBandera ? '🚩 BANDERA' : '⛏ CAVAR'}
        </button>
        <button className="px-btn" onClick={reset}>
          🔄 REINICIAR
        </button>
        <button className="px-btn" onClick={volverConfig}>
          DIFICULTAD
        </button>
      </div>

      {estado === 'ganado' && <p className="mina__mensaje mina__mensaje--ok">¡GANASTE! 🎉</p>}
      {estado === 'perdido' && <p className="mina__mensaje mina__mensaje--ko">¡BOOM! 💥</p>}
    </div>
  )
}
