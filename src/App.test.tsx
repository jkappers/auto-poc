import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the heading', () => {
    render(<App />)
    expect(screen.getByText('auto-poc')).toBeInTheDocument()
  })

  it('renders the workflow steps', () => {
    render(<App />)
    expect(screen.getByText('How it works')).toBeInTheDocument()
    expect(screen.getByText(/agent-ready/)).toBeInTheDocument()
  })
})
