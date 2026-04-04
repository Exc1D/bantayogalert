---
status: testing
phase: 08-contacts-management
source:
  - 08-01-SUMMARY.md
  - 08-02-SUMMARY.md
  - 08-03-SUMMARY.md
  - 08-04-SUMMARY.md
started: 2026-04-04T03:10:00Z
updated: 2026-04-04T03:11:00Z
---

## Current Test

number: 2
name: Contacts Route - Admin User
expected: |
  Log in as a municipal_admin. Navigate to http://localhost:5173/app/contacts
  (or the dev server URL). The ContactsPage loads with:
  - ContactsFilterBar (search input, type dropdown)
  - ContactsList showing active contacts
  - "Add Contact" button visible
awaiting: user response

## Tests

### 1. Cold Start Build
expected: Run `npm run build`. TypeScript compiles without errors. Vite produces production build
  with no warnings. Output includes bundled JS and CSS for the contacts feature.
result: pass

### 2. Contacts Route - Admin User
expected: |
  Log in as a municipal_admin. Navigate to http://localhost:5173/app/contacts
  (or the dev server URL). The ContactsPage loads with:
  - ContactsFilterBar (search input, type dropdown)
  - ContactsList showing active contacts
  - "Add Contact" button visible
result: pending

### 2. Contacts Route - Admin User
expected: |
  Log in as a municipal_admin. Navigate to http://localhost:5173/app/contacts
  (or the dev server URL). The ContactsPage loads with:
  - ContactsFilterBar (search input, type dropdown)
  - ContactsList showing active contacts
  - "Add Contact" button visible
result: pending

### 3. Contacts Route - Non-Admin Redirect
expected: |
  Log in as a citizen (non-admin). Navigate to /app/contacts.
  User is redirected away from /app/contacts (back to /app or login).
  The page is not accessible to non-admin users.
result: pending

### 4. Desktop NavRail Contacts Item
expected: |
  Log in as admin on desktop (≥1280px viewport).
  DesktopNavRail on the left shows "Contacts" nav item.
  Clicking Contacts navigates to /app/contacts and highlights the item.
result: pending

### 5. Mobile Bottom Tabs Contacts Tab (Admin Only)
expected: |
  Log in as admin on mobile (≤768px viewport).
  MobileBottomTabs shows a Contacts tab.
  Tapping Contacts navigates to /app/contacts.
  (Note: Citizens should NOT see this tab.)
result: pending

### 6. ContactsFilterBar - Search
expected: |
  With contacts present, type in the search input.
  The list filters in real-time as you type (client-side, no server round-trip).
  Clearing search shows all contacts again.
result: pending

### 7. ContactsFilterBar - Type Filter
expected: |
  Select a contact type from the dropdown (e.g., "Fire", "Medical", "Police").
  The list filters to show only contacts of that type.
  "All Types" option shows all contacts.
result: pending

### 8. ContactsFilterBar - Active Filter Pills
expected: |
  With a filter active (search or type), an active filter pill appears in the filter bar.
  Clicking the × on the pill clears that specific filter.
result: pending

### 9. Add Contact - Modal Opens
expected: |
  Click the "Add Contact" button.
  A modal/overlay appears with the ContactForm.
  Form fields: Name, Agency, Type (dropdown), Municipality (dropdown),
  Email, Phone Numbers (add/remove), Capabilities (add/remove).
result: pending

### 10. Add Contact - Submit Creates Contact
expected: |
  Fill in required fields (Name, Agency, Type, Municipality).
  Add a phone number.
  Click Submit/Save.
  Modal closes.
  New contact appears in the active contacts list.
result: pending

### 11. Add Contact - Validation
expected: |
  Try to submit the form with required fields empty.
  Validation errors appear inline on the form
  (Name required, Agency required, Type required, Municipality required).
  Form does not submit.
result: pending

### 12. Edit Contact - Modal Pre-fills
expected: |
  In the contact list, click the Edit button on a contact.
  Modal opens with the form pre-filled with that contact's current data.
  All fields are editable except Municipality (immutable per design).
result: pending

### 13. Edit Contact - Submit Updates
expected: |
  Change the Agency name (or another field).
  Click Submit/Save.
  Modal closes.
  Contact card in the list shows the updated agency name.
result: pending

### 14. Deactivate Contact
expected: |
  Click the Deactivate button on an active contact.
  Contact immediately moves from the "Active" section to the "Inactive" section.
  Inactive contacts show reduced opacity and an "Inactive" badge.
result: pending

### 15. Reactivate Contact
expected: |
  In the inactive section, click the Reactivate button on an inactive contact.
  Contact moves back to the "Active" section with normal styling.
result: pending

### 16. Provincial Superadmin Scope
expected: |
  Log in as provincial_superadmin.
  Navigate to /app/contacts.
  ContactsPage shows contacts from ALL municipalities (province-wide view).
  (vs. municipal_admin who only sees their own municipality's contacts).
result: pending

## Summary

total: 16
passed: 1
issues: 0
pending: 15
skipped: 0

## Gaps

[none yet]
