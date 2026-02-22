import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the Todo heading', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /todo/i })).toBeInTheDocument()
  })

  it('renders the input with placeholder', () => {
    render(<App />)
    expect(screen.getByPlaceholderText(/add a todo/i)).toBeInTheDocument()
  })

  it('adds a todo item on Enter', () => {
    render(<App />)
    const input = screen.getByPlaceholderText(/add a todo/i)
    fireEvent.change(input, { target: { value: 'Buy groceries' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByText('Buy groceries')).toBeInTheDocument()
  })

  it('clears the input after adding a todo', () => {
    render(<App />)
    const input = screen.getByPlaceholderText(/add a todo/i)
    fireEvent.change(input, { target: { value: 'Buy groceries' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(input).toHaveValue('')
  })

  it('does not add a todo when input is empty', () => {
    render(<App />)
    const input = screen.getByPlaceholderText(/add a todo/i)
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
  })

  it('does not add a todo when input is only whitespace', () => {
    render(<App />)
    const input = screen.getByPlaceholderText(/add a todo/i)
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
  })

  it('renders a checkbox for each todo', () => {
    render(<App />)
    const input = screen.getByPlaceholderText(/add a todo/i)
    fireEvent.change(input, { target: { value: 'Task one' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    fireEvent.change(input, { target: { value: 'Task two' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(2)
  })

  it('renders a timer SVG for each todo', () => {
    render(<App />)
    const input = screen.getByPlaceholderText(/add a todo/i)
    fireEvent.change(input, { target: { value: 'Timed task' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByRole('img', { name: /timer/i })).toBeInTheDocument()
  })
})
