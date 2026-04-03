import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { App } from './App'

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    // App renders a blank white page, so we just verify it mounts
    const root = document.getElementById('root')
    expect(root).toBeTruthy()
  })

  it('sets the document title to Bantayog Alert', () => {
    render(<App />)
    expect(document.title).toBe('Bantayog Alert')
  })

  it('renders a div that fills the viewport', () => {
    render(<App />)
    const div = document.querySelector('div[style*="100vh"]')
    expect(div).toBeTruthy()
  })
})
