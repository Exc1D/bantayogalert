import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { HelmetProvider } from 'react-helmet-async'
import { MemoryRouter } from 'react-router-dom'

// Mock firebase/app to prevent Firebase from initializing at module load
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
  getApp: vi.fn(),
}))

// Mock firebase/auth to prevent GoogleAuthProvider instantiation at module load
vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: vi.fn().mockImplementation(() => ({
    addScope: vi.fn(),
    setCustomParameters: vi.fn(),
  })),
  getAuth: vi.fn(),
  signInWithPopup: vi.fn(),
  setPersistence: vi.fn(),
  browserLocalPersistence: {},
  onAuthStateChanged: vi.fn(),
  signOut: vi.fn(),
}))

// Mock firebase/firestore
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
}))

// Mock firebase/storage
vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(),
  ref: vi.fn(),
}))

// Mock auth providers to prevent module-level instantiation
vi.mock('./lib/auth/providers', () => ({
  googleProvider: {
    addScope: vi.fn(),
    setCustomParameters: vi.fn(),
  },
  emailPasswordProvider: {
    signInWithPopup: vi.fn(),
  },
}))

// Mock Firebase config module to return mock instances
vi.mock('./lib/firebase/config', () => ({
  firebase: {
    app: {},
    auth: {},
    db: {},
    storage: {},
  },
  firebaseApp: {},
  auth: {},
  db: {},
  storage: {},
}))

// Mock AppCheckProvider
vi.mock('./lib/app-check', () => ({
  AppCheckProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock router guards
vi.mock('./lib/router/guards', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => children,
  AdminRoute: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock auth pages
vi.mock('./app/auth/login/page', () => ({
  LoginPage: () => ({ $$typeof: Symbol('react.element'), type: 'div', props: {}, ref: null }),
}))
vi.mock('./app/auth/register/page', () => ({
  RegisterPage: () => ({ $$typeof: Symbol('react.element'), type: 'div', props: {}, ref: null }),
}))
vi.mock('./app/auth/profile/page', () => ({
  ProfilePage: () => ({ $$typeof: Symbol('react.element'), type: 'div', props: {}, ref: null }),
}))

// Mock shell router to keep the test focused on app-level routing + title behavior
vi.mock('./app/shell/ShellRouter', () => ({
  ShellRouter: () => (
    <main>
      <h1>Bantayog Alert</h1>
    </main>
  ),
}))

import { App } from './App'

const renderWithProviders = (
  ui: React.ReactElement,
  { route = '/app' }: { route?: string } = {}
) => {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </HelmetProvider>
  )
}

describe('App', () => {
  it('renders without crashing', () => {
    renderWithProviders(<App />)
    expect(screen.getByRole('heading', { name: 'Bantayog Alert' })).toBeTruthy()
  })

  it('sets the document title to Bantayog Alert', async () => {
    renderWithProviders(<App />)
    await waitFor(() => {
      expect(document.title).toBe('Bantayog Alert')
    })
  })

  it('renders the app shell with a main heading', () => {
    renderWithProviders(<App />)
    expect(screen.getByRole('heading', { name: 'Bantayog Alert' })).toBeTruthy()
  })
})
