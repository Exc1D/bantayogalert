import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { HelmetProvider } from 'react-helmet-async'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { App } from './App'

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
}))

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: vi.fn().mockImplementation(() => ({
    addScope: vi.fn(),
    setCustomParameters: vi.fn(),
  })),
  getAuth: vi.fn(() => ({})),
  signInWithPopup: vi.fn(),
  setPersistence: vi.fn(),
  browserLocalPersistence: {},
  onAuthStateChanged: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  doc: vi.fn(),
}))

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
  ref: vi.fn(),
}))

vi.mock('./lib/auth/providers', () => ({
  googleProvider: {
    addScope: vi.fn(),
    setCustomParameters: vi.fn(),
  },
  emailPasswordProvider: {
    signInWithPopup: vi.fn(),
  },
}))

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
  firebaseRuntime: {
    useEmulator: true,
    appCheckMode: 'audit',
    appCheckDebugToken: '',
    appCheckSiteKey: '',
  },
}))

vi.mock('./lib/app-check', () => ({
  AppCheckProvider: ({ children }: { children: ReactNode }) => children,
}))

vi.mock('./lib/router/guards', () => ({
  ProtectedRoute: ({ children }: { children: ReactNode }) => children,
  AdminRoute: ({ children }: { children: ReactNode }) => children,
}))

vi.mock('./app/auth/login/page', () => ({
  LoginPage: () => <main><h1>login page</h1></main>,
}))

vi.mock('./app/auth/register/page', () => ({
  RegisterPage: () => <main><h1>register page</h1></main>,
}))

vi.mock('./app/auth/profile/page', () => ({
  ProfilePage: () => <main><h1>profile page</h1></main>,
}))

vi.mock('./app/public/landing/page', () => ({
  LandingPage: () => <main><h1>landing page</h1></main>,
}))

vi.mock('./app/public/map/page', () => ({
  PublicMapPage: () => <main><h1>public map</h1></main>,
}))

vi.mock('./app/public/alerts/page', () => ({
  PublicAlertsPage: () => <main><h1>public alerts</h1></main>,
}))

vi.mock('./app/public/alerts/detail/page', () => ({
  PublicAlertDetailPage: () => <main><h1>public alert detail</h1></main>,
}))

vi.mock('./app/shell/ShellRouter', () => ({
  ShellRouter: () => (
    <main>
      <h1>app shell</h1>
    </main>
  ),
}))

vi.mock('./components/alerts/AlertsFeed', () => ({
  AlertsFeed: () => <section>alerts feed</section>,
}))

vi.mock('./components/alerts/CreateAlertForm', () => ({
  CreateAlertForm: () => <section>create alert form</section>,
}))

vi.mock('./components/report/AdminQueueFeed', () => ({
  AdminQueueFeed: () => <section>admin queue</section>,
}))

vi.mock('./app/admin/analytics/page', () => ({
  AdminAnalyticsPage: () => <section>analytics page</section>,
}))

vi.mock('./app/admin/audit/page', () => ({
  AdminAuditPage: () => <section>audit page</section>,
}))

vi.mock('./app/report/ReportFormPage', () => ({
  ReportFormPage: () => <section>report form page</section>,
}))

vi.mock('./app/report/ReportTrack', () => ({
  ReportTrack: () => <section>report track</section>,
}))

vi.mock('./app/contacts/page', () => ({
  default: () => <section>contacts page</section>,
}))

vi.mock('./lib/seo/PrivateRouteMeta', () => ({
  PrivateRouteMeta: () => (
    <div data-testid="private-route-meta">noindex, nofollow</div>
  ),
}))

const renderWithProviders = (route: string) => {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>
    </HelmetProvider>
  )
}

describe('App routes', () => {
  it('renders the landing page route', async () => {
    renderWithProviders('/')

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'landing page' })).toBeTruthy()
    })
  })

  it('renders the public map route', async () => {
    renderWithProviders('/public/map')

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'public map' })).toBeTruthy()
    })
  })

  it('renders the public alerts route', async () => {
    renderWithProviders('/public/alerts')

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'public alerts' })
      ).toBeTruthy()
    })
  })

  it('renders private-route metadata for app routes', async () => {
    renderWithProviders('/app')

    await waitFor(() => {
      expect(screen.getByTestId('private-route-meta')).toHaveTextContent(
        'noindex, nofollow'
      )
    })
  })
})
