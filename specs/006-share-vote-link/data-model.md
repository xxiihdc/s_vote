# Data Model — 006-share-vote-link

## Entity: VoteCreationOutcome
Represents post-create metadata returned by server action and consumed by create page.

### Fields
- `created`: string literal flag (`"1"`) indicating successful vote creation state.
- `voteUrl`: absolute URL string for voting page, canonical origin from `APP_URL`.
- `resultUrl`: absolute URL string for token-based results page.
- `tokenExpiresAt`: ISO-8601 datetime string.

### Validation Rules
- `created` is required to render success state.
- `voteUrl` is required and MUST be absolute URL with `/votes/{voteId}` path.
- `resultUrl` is required and MUST be absolute URL with `/results/{token}` path.
- `tokenExpiresAt` is optional for rendering but if present MUST be valid ISO datetime.

### State Transitions
- `idle` → `created-success`: all required fields valid (`created`, `voteUrl`, `resultUrl`).
- `idle` → `created-incomplete`: create flag present but one required link missing/invalid.
- `created-incomplete` renders generic share-link error and suppresses success panel.

## Entity: ShareLinkViewModel
Represents UI-level rendering data for link actions.

### Fields
- `label`: user-facing description (Voting URL / Result URL).
- `href`: absolute URL string.
- `copyLabel`: button text for copy action.

### Relationships
- One `VoteCreationOutcome` composes multiple `ShareLinkViewModel` records.
- Minimum for success rendering: 2 links (voting + results).
