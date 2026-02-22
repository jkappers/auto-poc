import { useState, useEffect } from 'react'
import './App.css'

interface Todo {
  id: string
  text: string
  createdAt: number
  fading: boolean
}

const TIMER_DURATION = 30 * 60 * 1000

function getTimerPath(proportion: number): string {
  if (proportion >= 1) {
    // Near-full circle (full circle path causes SVG rendering issues)
    return 'M 12 12 L 12 2 A 10 10 0 1 1 11.9999 2 Z'
  }
  if (proportion <= 0) return ''

  const angle = proportion * 2 * Math.PI
  const endX = 12 + 10 * Math.sin(angle)
  const endY = 12 - 10 * Math.cos(angle)
  const largeArcFlag = angle > Math.PI ? 1 : 0

  return `M 12 12 L 12 2 A 10 10 0 ${largeArcFlag} 1 ${endX.toFixed(4)} ${endY.toFixed(4)} Z`
}

function TimerIndicator({ createdAt, now }: { createdAt: number; now: number }) {
  const elapsed = now - createdAt
  const proportion = Math.max(0, 1 - elapsed / TIMER_DURATION)
  const path = getTimerPath(proportion)

  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-label="Timer">
      <circle cx="12" cy="12" r="10" className="timer-bg" />
      {path && <path d={path} className="timer-fill" />}
    </svg>
  )
}

function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [inputValue, setInputValue] = useState('')
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = Date.now()
      setNow(currentTime)
      setTodos(prev =>
        prev.filter(todo => currentTime - todo.createdAt < TIMER_DURATION)
      )
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      const newTodo: Todo = {
        id: crypto.randomUUID(),
        text: inputValue.trim(),
        createdAt: Date.now(),
        fading: false,
      }
      setTodos(prev => [newTodo, ...prev])
      setInputValue('')
    }
  }

  const handleComplete = (id: string) => {
    setTodos(prev =>
      prev.map(todo => (todo.id === id ? { ...todo, fading: true } : todo))
    )
    setTimeout(() => {
      setTodos(prev => prev.filter(todo => todo.id !== id))
    }, 500)
  }

  return (
    <div className="app">
      <h1>Todo</h1>
      <input
        type="text"
        className="todo-input"
        placeholder="Add a todo and press Enter..."
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <ul className="todo-list">
        {todos.map(todo => (
          <li key={todo.id} className={`todo-item${todo.fading ? ' fading' : ''}`}>
            <input
              type="checkbox"
              className="todo-checkbox"
              checked={todo.fading}
              onChange={() => {
                if (!todo.fading) handleComplete(todo.id)
              }}
            />
            <span className="todo-text">{todo.text}</span>
            <TimerIndicator createdAt={todo.createdAt} now={now} />
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App
