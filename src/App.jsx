import { Routes, Route } from 'react-router-dom'
import Ruleta from './components/Ruleta.jsx'
import GameRoute from './components/GameRoute.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Ruleta />} />
      <Route path="/:slug" element={<GameRoute />} />
    </Routes>
  )
}
