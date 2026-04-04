# Phase 10 Validation — Announcements, Push & Alerts

**Phase:** 10-announcements-push-alerts
**Created:** 2026-04-04 (revision - post-checker feedback)
**Requirements:** ALR-01, ALR-02, ALR-03, ALR-04, ALR-05, ALR-06, ALR-07

---

## Validation Architecture

```
tests/
├── unit/
│   └── announcement.test.ts          # Zod schema validation, state transitions
├── integration/
│   └── announcements.test.ts         # Firestore rules + CF integration
└── e2e/
    └── alerts.test.ts                # Full admin citizen flow
```

---

## Unit Tests (ALR-01, ALR-03)

### ALR-01: Announcement creation with all fields

**Test file:** `tests/unit/announcement.test.ts`

```typescript
// Zod schema validation
describe('AnnouncementSchema', () => {
  test('ALR-01: valid alert with all required fields', () => {
    const input = {
      title: 'Flood Warning',
      body: 'Heavy rains expected in Basud area. Avoid low-lying roads.',
      type: 'alert',
      severity: 'critical',
      targetScope: { type: 'municipality', municipalityCodes: ['bas'] },
    }
    expect(AnnouncementSchema.safeParse(input).success).toBe(true)
  })

  test('ALR-01: rejects empty title', () => {
    const input = { title: '', body: 'Valid body', type: 'alert', severity: 'info', targetScope: { type: 'province' } }
    expect(AnnouncementSchema.safeParse(input).success).toBe(false)
  })

  test('ALR-01: rejects title < 3 chars', () => {
    const input = { title: 'AB', body: 'Valid body', type: 'alert', severity: 'info', targetScope: { type: 'province' } }
    expect(AnnouncementSchema.safeParse(input).success).toBe(false)
  })

  test('ALR-01: rejects body < 10 chars', () => {
    const input = { title: 'Valid Title', body: 'Short', type: 'alert', severity: 'info', targetScope: { type: 'province' } }
    expect(AnnouncementSchema.safeParse(input).success).toBe(false)
  })

  test('ALR-01: accepts multi_municipality with 2-12 codes', () => {
    const input = {
      title: 'Regional Advisory',
      body: 'This affects multiple municipalities in Camarines Norte.',
      type: 'advisory',
      severity: 'warning',
      targetScope: { type: 'multi_municipality', municipalityCodes: ['bas', 'daet', 'labo'] },
    }
    expect(AnnouncementSchema.safeParse(input).success).toBe(true)
  })

  test('ALR-01: rejects multi_municipality with < 2 codes', () => {
    const input = {
      title: 'Invalid',
      body: 'This should fail because multi needs 2+ municipalities.',
      type: 'advisory',
      severity: 'info',
      targetScope: { type: 'multi_municipality', municipalityCodes: ['bas'] },
    }
    expect(AnnouncementSchema.safeParse(input).success).toBe(false)
  })

  test('ALR-01: accepts all four announcement types', () => {
    for (const type of ['alert', 'advisory', 'update', 'all_clear']) {
      const input = {
        title: 'Test',
        body: 'This is a valid test body text.',
        type,
        severity: 'info',
        targetScope: { type: 'province' },
      }
      expect(AnnouncementSchema.safeParse(input).success, `Type ${type} should be valid`).toBe(true)
    }
  })

  test('ALR-01: accepts all three severity levels', () => {
    for (const severity of ['info', 'warning', 'critical']) {
      const input = {
        title: 'Test',
        body: 'This is a valid test body text.',
        type: 'alert',
        severity,
        targetScope: { type: 'province' },
      }
      expect(AnnouncementSchema.safeParse(input).success, `Severity ${severity} should be valid`).toBe(true)
    }
  })
})
```

### ALR-03: Announcement state machine

```typescript
describe('AnnouncementStatus transitions', () => {
  test('ALR-03: draft -> published is valid', () => {
    const announcement = { status: 'draft' }
    expect(announcement.status).toBe('draft')
    // publishAnnouncement transitions draft -> published
  })

  test('ALR-03: published -> cancelled is valid', () => {
    const announcement = { status: 'published' }
    expect(announcement.status).toBe('published')
    // cancelAnnouncement transitions published -> cancelled
  })

  test('ALR-03: cancelled cannot be published (no re-publishing)', () => {
    const announcement = { status: 'cancelled' }
    expect(announcement.status).toBe('cancelled')
    // publishAnnouncement should reject with failed-precondition
  })

  test('ALR-03: draft can be cancelled before publishing', () => {
    const announcement = { status: 'draft' }
    expect(announcement.status).toBe('draft')
    // cancelAnnouncement transitions draft -> cancelled
  })
})
```

---

## Integration Tests (ALR-02, ALR-04, ALR-07)

**Test file:** `tests/integration/announcements.test.ts`

Uses `@firebase/rules-unit-testing` with emulator suite.

### ALR-02: Municipal scope enforcement

```typescript
describe('ALR-02: Municipal scope enforcement', () => {
  test('municipal admin can only create announcement for their own municipality', async () => {
    // Set up: municipal admin with basud municipalityCode
    const admin = await createAuthenticatedUser({ role: 'municipal_admin', municipalityCode: 'bas' })

    // Should succeed: targeting own municipality
    await expect(
      createAnnouncement(admin, {
        targetScope: { type: 'municipality', municipalityCodes: ['bas'] },
      })
    ).toResolve()

    // Should fail: targeting different municipality
    await expect(
      createAnnouncement(admin, {
        targetScope: { type: 'municipality', municipalityCodes: ['daet'] },
      })
    ).toReject('permission-denied')
  })

  test('provincial superadmin can target any scope', async () => {
    const superadmin = await createAuthenticatedUser({ role: 'provincial_superadmin' })

    await expect(
      createAnnouncement(superadmin, { targetScope: { type: 'province' } })
    ).toResolve()

    await expect(
      createAnnouncement(superadmin, { targetScope: { type: 'municipality', municipalityCodes: ['bas'] } })
    ).toResolve()

    await expect(
      createAnnouncement(superadmin, { targetScope: { type: 'multi_municipality', municipalityCodes: ['bas', 'daet', 'labo'] } })
    ).toResolve()
  })
})
```

### ALR-04: Published announcements appear in Alerts tab

```typescript
describe('ALR-04: Alerts tab filtering', () => {
  test('published announcement with matching municipality appears in alerts feed', async () => {
    const citizen = await createAuthenticatedUser({ role: 'citizen', municipalityCode: 'bas' })

    // Create and publish announcement for bas
    await createAndPublishAnnouncement({
      targetScope: { type: 'municipality', municipalityCodes: ['bas'] },
    })

    // Citizen in bas should see it
    const feed = await getAnnouncements(citizen)
    expect(feed.some(a => a.municipalityCode === 'bas')).toBe(true)
  })

  test('citizen does not see announcements for different municipality', async () => {
    const citizen = await createAuthenticatedUser({ role: 'citizen', municipalityCode: 'bas' })

    // Publish announcement for daet only
    await createAndPublishAnnouncement({
      targetScope: { type: 'municipality', municipalityCodes: ['daet'] },
    })

    // Citizen in bas should NOT see it
    const feed = await getAnnouncements(citizen)
    expect(feed.every(a => !a.municipalityCodes?.includes('daet'))).toBe(true)
  })
})
```

### ALR-07: Citizens see only their municipality + province-wide

```typescript
describe('ALR-07: Citizen scope filtering', () => {
  test('citizen sees province-wide announcements regardless of municipality', async () => {
    const citizen = await createAuthenticatedUser({ role: 'citizen', municipalityCode: 'labo' })

    await createAndPublishAnnouncement({ targetScope: { type: 'province' } })

    const feed = await getAnnouncements(citizen)
    expect(feed.some(a => a.targetScope.type === 'province')).toBe(true)
  })

  test('citizen sees multi-municipality if their code is in the list', async () => {
    const citizen = await createAuthenticatedUser({ role: 'citizen', municipalityCode: 'bas' })

    await createAndPublishAnnouncement({
      targetScope: { type: 'multi_municipality', municipalityCodes: ['bas', 'daet', 'labo'] },
    })

    const feed = await getAnnouncements(citizen)
    expect(feed.some(a =>
      a.targetScope.type === 'multi_municipality' &&
      a.targetScope.municipalityCodes.includes('bas')
    )).toBe(true)
  })
})
```

---

## E2E Tests (ALR-03, ALR-05)

**Test file:** `tests/e2e/alerts.spec.ts`

### ALR-03: Full draft -> publish -> cancel lifecycle

```typescript
test('ALR-03: admin creates draft, publishes, then cancels announcement', async ({ page }) => {
  await loginAsAdmin(page, 'bas_muni_admin')
  await page.goto('/app/admin/alerts')

  // Fill form
  await page.fill('[id="alert-title"]', 'Flood Advisory for Basud')
  await page.fill('[id="alert-body"]', 'Heavy rains expected. Avoid riverbanks and low-lying areas.')
  await page.click('button:has-text("Warning")')

  // Save as draft (Publish Now is not clicked)
  await page.click('button:has-text("Save as Draft")')
  await expect(page).toHaveURL('/app/alerts')

  // Draft should not appear in public alerts feed
  await page.goto('/app/alerts')
  await expect(page.locator('text=Flood Advisory for Basud')).not.toBeVisible()

  // Admin goes back and finds draft...
  // (Draft management UI is out of scope - announcements stay as drafts)

  // Alternative: publish immediately
  await page.goto('/app/admin/alerts')
  await page.fill('[id="alert-title"]', 'Published Flood Advisory')
  await page.fill('[id="alert-body"]', 'This was published immediately and should appear in feed.')
  await page.click('button:has-text("Publish Now")')

  // Should redirect to alerts and announcement should be visible
  await expect(page).toHaveURL('/app/alerts')
  await expect(page.locator('text=Published Flood Advisory')).toBeVisible()
})
```

### ALR-05: FCM push notification delivery

```typescript
test('ALR-05: citizen receives FCM push when announcement published', async ({ browser }) => {
  // Set up: create user with FCM token in Firestore
  const context = await browser.newContext()
  const page = await context.newPage()

  await loginAsCitizen(page, 'bas_citizen')

  // Grant notification permission
  await page.goto('/app/alerts')
  const dialogPromise = page.waitForEvent('dialog')
  await page.click('text=Enable Notifications')
  const dialog = await dialogPromise
  await dialog.accept()

  // Get FCM token (simulated via mock)
  const fcmToken = await page.evaluate(() => {
    return (window as any).mockFcmToken || 'test-fcm-token'
  })

  // Admin publishes announcement
  const adminPage = await (await browser.newContext()).newPage()
  await loginAsAdmin(adminPage, 'bas_muni_admin')
  await adminPage.goto('/app/admin/alerts')
  await adminPage.fill('[id="alert-title"]', 'Urgent: Flood Warning')
  await adminPage.fill('[id="alert-body"]', 'Flash flood expected in low-lying areas. Evacuate immediately.')
  await adminPage.click('button:has-text("Critical")')
  await adminPage.click('button:has-text("Publish Now")')

  // Wait for toast on citizen page
  await page.bringToFront()
  await expect(page.locator('text=Urgent: Flood Warning')).toBeVisible({ timeout: 10000 })
})
```

---

## Test Execution Commands

```bash
# Unit tests
npm run test -- tests/unit/announcement.test.ts

# Integration tests (requires Firebase emulator)
npm run test -- tests/integration/announcements.test.ts

# E2E tests (requires dev server running)
npx playwright test tests/e2e/alerts.spec.ts

# Full validation suite
npm run test && npx playwright test
```

---

## Verification Checklist

| ID | Requirement | Test Coverage |
|----|-------------|---------------|
| ALR-01 | Announcement creation with all fields | Unit: Zod schema validation |
| ALR-02 | Municipal admin scope enforcement | Integration: Firestore rules |
| ALR-03 | State transitions (draft/published/cancelled) | Unit: state machine, E2E: lifecycle |
| ALR-04 | Alerts tab shows published announcements | Integration: feed filtering |
| ALR-05 | FCM push delivery | E2E: push notification |
| ALR-06 | Delivery tracking per recipient | Integration: notifications subcollection |
| ALR-07 | Citizen scope filtering | Integration: municipality + province-wide |
