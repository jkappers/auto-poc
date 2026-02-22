import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the heading', () => {
    render(<App />)
    expect(screen.getByText('Vite + React')).toBeInTheDocument()
  })

  it('shows 0 Ohmz energy initially', () => {
    render(<App />)
    expect(screen.getByText('Energy generated: 0 Ohmz')).toBeInTheDocument()
  })

  it('increments energy by 1 Ohmz per click', async () => {
    const user = userEvent.setup()
    render(<App />)
    const button = screen.getByRole('button', { name: /count is/ })
    await user.click(button)
    expect(screen.getByText('Energy generated: 1 Ohmz')).toBeInTheDocument()
    await user.click(button)
    expect(screen.getByText('Energy generated: 2 Ohmz')).toBeInTheDocument()
  })
})
