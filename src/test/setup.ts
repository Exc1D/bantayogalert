import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { JSDOM } from 'jsdom'

// Set up jsdom document with #root element
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>')
Object.defineProperty(global, 'document', {
  value: dom.window.document,
  writable: true,
})
Object.defineProperty(global, 'window', {
  value: dom.window,
  writable: true,
})

// Clean up after each test
afterEach(() => {
  cleanup()
})

// Mock import.meta.env for Vitest
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_FIREBASE_API_KEY: 'test-api-key',
    VITE_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
    VITE_FIREBASE_DATABASE_URL: 'https://test.firebaseio.com',
    VITE_FIREBASE_PROJECT_ID: 'test-project',
    VITE_FIREBASE_STORAGE_BUCKET: 'test.appspot.com',
    VITE_FIREBASE_MESSAGING_SENDER_ID: '000000000000',
    VITE_FIREBASE_APP_ID: '1:000000000000:web:test',
    VITE_USE_EMULATOR: 'true',
    VITE_APP_CHECK_MODE: 'audit',
    VITE_APP_CHECK_DEBUG_TOKEN: 'test-app-check-debug-token',
    VITE_RECAPTCHA_ENTERPRISE_SITE_KEY: 'test-recaptcha-key',
  },
  writable: true,
})

// Mock Firebase modules to avoid actual Firebase initialization in tests
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
  getApps: vi.fn(() => []),
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
}))

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
}))

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
}))

vi.mock('firebase/app-check', () => ({
  initializeAppCheck: vi.fn(() => ({})),
  CustomProvider: vi.fn().mockImplementation((config) => config),
  ReCaptchaEnterpriseProvider: vi.fn().mockImplementation((siteKey: string) => ({
    siteKey,
  })),
}))

// Mock react-helmet-async to avoid HelmetProvider requirement
vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }: { children?: import('react').ReactNode }) => children,
  HelmetProvider: ({ children }: { children?: import('react').ReactNode }) => children,
}))
