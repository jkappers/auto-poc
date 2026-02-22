import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the heading', () => {
    render(<App />)
    expect(screen.getByText('Vite + React')).toBeInTheDocument()
  })

  it('shows 0.00 mJ energy initially', () => {
    render(<App />)
    expect(screen.getByText('Energy generated: 0.00 mJ')).toBeInTheDocument()
  })

  it('shows correct mJ energy per click', async () => {
    const user = userEvent.setup()
    render(<App />)
    const button = screen.getByRole('button', { name: /count is/ })
    await user.click(button)
    expect(screen.getByText('Energy generated: 0.90 mJ')).toBeInTheDocument()
    await user.click(button)
    expect(screen.getByText('Energy generated: 1.80 mJ')).toBeInTheDocument()
  })
})
