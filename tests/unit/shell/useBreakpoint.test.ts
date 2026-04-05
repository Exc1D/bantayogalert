import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBreakpoint } from '@/hooks/useBreakpoint'

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
  window.dispatchEvent(new Event('resize'))
}

describe('useBreakpoint', () => {
  it('should return tablet at 1024px default', () => {
    // JSDOM defaults innerWidth to 1024
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current.breakpoint).toBe('tablet')
    expect(result.current.isTablet).toBe(true)
    expect(result.current.isMobile).toBe(false)
    expect(result.current.isDesktop).toBe(false)
  })

  it('should return mobile at <= 768px', () => {
    setViewportWidth(768)
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current.breakpoint).toBe('mobile')
    expect(result.current.isMobile).toBe(true)
  })

  it('should return desktop at >= 1280px', () => {
    setViewportWidth(1280)
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current.breakpoint).toBe('desktop')
    expect(result.current.isDesktop).toBe(true)
  })

  it('should update breakpoint on resize', () => {
    const { result } = renderHook(() => useBreakpoint())

    act(() => {
      setViewportWidth(375)
    })

    expect(result.current.isMobile).toBe(true)

    act(() => {
      setViewportWidth(1440)
    })

    expect(result.current.isDesktop).toBe(true)
  })
})
