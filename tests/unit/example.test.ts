import { describe, it, expect } from 'vitest'

describe('Example Test Suite', () => {
  it('should pass basic assertion', () => {
    expect(1 + 1).toBe(2)
  })

  it('should handle string operations', () => {
    const greeting = 'Hello, Bantayog Alert!'
    expect(greeting).toContain('Bantayog Alert')
  })

  it('should work with arrays', () => {
    const municipalities = ['Basud', 'Daet', 'Labo']
    expect(municipalities).toHaveLength(3)
    expect(municipalities).toContain('Daet')
  })
})
