import { test, expect } from '@playwright/test'

// D-16: Playwright for smoke/E2E tests. Tests live in tests/smoke/
// home.spec.ts verifies the shell renders without console errors

test.describe('App Shell Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Collect console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        // Log but don't fail — some third-party libs log errors
        console.error(`Browser console error: ${msg.text()}`)
      }
    })
  })

  test('home page renders without crashing', async ({ page }) => {
    // Navigate to the app
    await page.goto('/')

    // Wait for the root element to be present
    await expect(page.locator('#root')).toBeVisible()

    // Verify the title
    await expect(page).toHaveTitle('Bantayog Alert')
  })

  test('no console errors on page load', async ({ page }) => {
    const consoleErrors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Filter out known non-issue errors (e.g., third-party library warnings)
    const realErrors = consoleErrors.filter(
      (err) =>
        !err.includes('favicon') &&
        !err.includes('404') &&
        !err.includes('third-party')
    )

    expect(realErrors).toHaveLength(0)
  })

  test('page has correct meta tags', async ({ page }) => {
    await page.goto('/')

    // Verify theme-color meta tag
    const themeColor = page.locator('meta[name="theme-color"]')
    await expect(themeColor).toHaveAttribute('content', '#dc2626')
  })

  test('manifest is accessible', async ({ page }) => {
    await page.goto('/')

    // Check manifest link exists
    const manifestLink = page.locator('link[rel="manifest"]')
    await expect(manifestLink).toHaveAttribute('href', '/manifest.json')

    // Verify manifest is valid JSON
    const response = await page.request.get('/manifest.json')
    expect(response.ok()).toBeTruthy()

    const manifest = await response.json()
    expect(manifest.name).toBe('Bantayog Alert')
    expect(manifest.theme_color).toBe('#dc2626')
  })
})
