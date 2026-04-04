# 12-06 Summary: App Check Rollout Controls

## Completed: 2026-04-04

## Changes Made

### Env contract
- Updated [.env.example](/home/exxeed/dev/projects/bantayogalert/.env.example) to document `VITE_APP_CHECK_MODE`, `VITE_APP_CHECK_DEBUG_TOKEN`, and `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY`
- Updated [src/lib/firebase/config.ts](/home/exxeed/dev/projects/bantayogalert/src/lib/firebase/config.ts) with shared runtime config for emulator usage and App Check rollout values

### Provider selection
- Rewrote [src/lib/app-check/AppCheckProvider.tsx](/home/exxeed/dev/projects/bantayogalert/src/lib/app-check/AppCheckProvider.tsx) so enforced production mode uses `ReCaptchaEnterpriseProvider`, while emulator/dev/test paths stay on a safe audit/debug provider path
- Updated [src/test/setup.ts](/home/exxeed/dev/projects/bantayogalert/src/test/setup.ts) with App Check env defaults and `firebase/app-check` mocks

## Verification
- Production App Check no longer depends on the old placeholder-only provider path
- Emulator and test builds do not require a live reCAPTCHA Enterprise site key
- Rollout is env-gated so the final production enforcement flip can happen after the burn-in window
