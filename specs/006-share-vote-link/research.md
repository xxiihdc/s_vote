# Phase 0 Research — 006-share-vote-link

## Decision 1: Use `APP_URL` as canonical origin for voting URL
- **Decision**: Build voting URL as absolute URL using canonical `APP_URL` + `/votes/{voteId}`.
- **Rationale**: Keeps shared links stable across local/dev/proxy environments and enforces spec clarification that origin must be deterministic.
- **Alternatives considered**:
  - Use request origin: rejected because may vary behind proxies and is not canonical.
  - Prefer request origin then fallback `APP_URL`: rejected because still allows environment drift.

## Decision 2: Keep success contract as redirect-query metadata
- **Decision**: Continue passing post-create metadata via redirect query params and add `voteUrl`.
- **Rationale**: Matches existing create-vote flow, minimizes surface area change, and keeps implementation simple.
- **Alternatives considered**:
  - Session storage/local storage: rejected because adds state complexity and hydration concerns.
  - Persist success context in database: rejected as unnecessary for transient UI state.

## Decision 3: Incomplete link metadata handling
- **Decision**: Hide success panel and show generic error message when required links are missing/invalid.
- **Rationale**: Prevents misleading partial success and aligns with clarified UX requirement.
- **Alternatives considered**:
  - Show partial success with one link: rejected due to confusion risk.
  - Silently hide success without message: rejected for poor feedback.

## Decision 4: Reuse existing copy button component
- **Decision**: Extend existing copy button with optional label prop for voting/result contexts.
- **Rationale**: Avoids duplicated logic and preserves UI consistency.
- **Alternatives considered**:
  - Create separate copy components: rejected as redundant maintenance.

## Decision 5: Testing strategy scope
- **Decision**: Update targeted integration test for redirect contract and keep existing behavior tests intact.
- **Rationale**: Change is centered on post-create redirect and UI consumption of metadata.
- **Alternatives considered**:
  - Full-suite rerun as mandatory: deferred because targeted regression gives immediate confidence and full suite can run in CI.
