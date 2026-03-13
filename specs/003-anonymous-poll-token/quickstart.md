# Quickstart: Anonymous Vote With Token Result URL

## Goal
Create a vote anonymously and view results through token URL.

## 1) Prepare environment
- Ensure required env vars for Supabase are set.
- Start app/services with existing Docker workflow.

## 2) Create vote
- Open vote creation UI.
- Enter question + at least 2 options.
- Submit without authentication.
- Verify success state shows `resultUrl` and copy action.

## 3) Validate token result access
- Open token URL in incognito/new browser.
- Verify results page loads without login.
- Confirm invalid token returns explicit unavailable state.
- Confirm expired token returns HTTP `410` and unavailable UI message.

## 4) Verify update behavior
- Cast responses for same vote from another client.
- Confirm result page updates within target interval.
- Confirm page transitions to unavailable state if token expires while page is open.

## 5) Validate quality gates
- Run strict type check (`tsc --noEmit`).
- Run unit and integration tests for create + token-result paths.
- Run Docker build/start validation flow.

## 6) Logs and health
- Verify correlation IDs in create and token-read logs.
- Verify health endpoint includes token-resolution/result-read readiness.
