import { createContext, useContext, useState, ReactNode } from 'react'

type ModalSection = 'feed' | 'report-detail' | 'profile' | 'alerts' | 'admin' | 'contacts' | 'announcement-create' | null

interface ModalContextValue {
  isOpen: boolean
  section: ModalSection
  open: (section: ModalSection) => void
  close: () => void
}

const ModalContext = createContext<ModalContextValue | null>(null)

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [section, setSection] = useState<ModalSection>(null)

  const open = (s: ModalSection) => {
    setSection(s)
    setIsOpen(true)
  }

  const close = () => {
    setIsOpen(false)
    // Don't reset section immediately — animation can complete first
  }

  return (
    <ModalContext.Provider value={{ isOpen, section, open, close }}>
      {children}
    </ModalContext.Provider>
  )
}

export function useModal(): ModalContextValue {
  const ctx = useContext(ModalContext)
  if (!ctx) throw new Error('useModal must be used within ModalProvider')
  return ctx
}
