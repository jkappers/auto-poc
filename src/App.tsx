import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

// Physics of a mouse click: Work = Force × Distance
const CLICK_FORCE_N = 0.45      // Newtons — typical mouse button actuation force (~45 gf)
const CLICK_DISTANCE_M = 0.002  // meters  — typical mouse button travel distance (2 mm)
const ENERGY_PER_CLICK_J = CLICK_FORCE_N * CLICK_DISTANCE_M  // Joules per click

function App() {
  const [count, setCount] = useState(0)
  const energyMJ = (count * ENERGY_PER_CLICK_J * 1000).toFixed(2)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>Energy generated: {energyMJ} mJ</p>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
