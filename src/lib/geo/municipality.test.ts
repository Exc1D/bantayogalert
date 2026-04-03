import { describe, it, expect } from 'vitest'
import { MUNICIPALITIES, getMunicipality } from './municipality'

describe('municipality', () => {
  it('has all 12 Camarines Norte municipalities', () => {
    expect(MUNICIPALITIES).toHaveLength(12)
  })

  it('each municipality has required fields', () => {
    MUNICIPALITIES.forEach(m => {
      expect(m.code.length).toBeGreaterThanOrEqual(3)
      expect(m.code.length).toBeLessThanOrEqual(4)
      expect(m.name).toBeTruthy()
      expect(m.center.lat).toBeGreaterThan(13.8)
      expect(m.center.lat).toBeLessThan(14.8)
      expect(m.center.lng).toBeGreaterThan(122.3)
      expect(m.center.lng).toBeLessThan(123.3)
    })
  })

  it('getMunicipality returns correct municipality', () => {
    const daet = getMunicipality('daet')
    expect(daet?.name).toBe('Daet')
  })

  it('getMunicipality returns undefined for unknown code', () => {
    expect(getMunicipality('xxx')).toBeUndefined()
  })
})
