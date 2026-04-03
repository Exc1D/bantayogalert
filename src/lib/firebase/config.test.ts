import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Firebase Config', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('should be configured with test environment variables', async () => {
    // Arrange: import.meta.env is already mocked in setup.ts
    const expectedKeys = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_STORAGE_BUCKET',
      'VITE_FIREBASE_MESSAGING_SENDER_ID',
      'VITE_FIREBASE_APP_ID',
    ]

    // Act & Assert
    expectedKeys.forEach((key) => {
      expect(import.meta.env[key]).toBeDefined()
      expect(typeof import.meta.env[key]).toBe('string')
    })
  })

  it('should have valid Firebase config values', async () => {
    // Arrange
    const config = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    }

    // Assert
    expect(config.apiKey).toBeTruthy()
    expect(config.authDomain).toBeTruthy()
    expect(config.projectId).toBeTruthy()
  })
})
