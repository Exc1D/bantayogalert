import { test, expect } from '@playwright/test'

test.describe('Bantayog Alert Smoke Tests', () => {
  test('homepage loads without errors', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Bantayog/i)
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
    expect(errors.filter((e) => !e.includes('Download the React DevTools'))).toHaveLength(0)
  })
})
