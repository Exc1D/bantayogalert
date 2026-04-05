import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { OverlayDrawer } from '@/components/ui/OverlayDrawer'

describe('BottomSheet', () => {
  it('should not render when not open', () => {
    render(
      <BottomSheet isOpen={false} onClose={vi.fn()}>Content</BottomSheet>
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should render when open', () => {
    render(
      <BottomSheet isOpen={true} onClose={vi.fn()}>Content</BottomSheet>
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('should call onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    render(
      <BottomSheet isOpen={true} onClose={onClose}>Content</BottomSheet>
    )
    fireEvent.click(screen.getByTestId('bottom-sheet-backdrop'))
    expect(onClose).toHaveBeenCalled()
  })

  it('should call onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    render(
      <BottomSheet isOpen={true} onClose={onClose}>Content</BottomSheet>
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })
})

describe('OverlayDrawer', () => {
  it('should not render when not open', () => {
    const { container } = render(
      <OverlayDrawer isOpen={false} onClose={vi.fn()}>Content</OverlayDrawer>
    )
    expect(container.textContent).toBe('')
  })
})
