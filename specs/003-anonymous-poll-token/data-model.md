# Data Model: Anonymous Vote With Token Result URL

## Entity: Vote
- **id**: uuid (PK)
- **question**: text (required, 1..1000)
- **status**: enum(`active`,`archived`,`deleted`)
- **token_hash**: text (unique, required)
- **token_expires_at**: timestamptz (required)
- **created_at**: timestamptz (required)
- **updated_at**: timestamptz (required)

### Validation Rules
- Question cannot be empty.
- Vote must include at least 2 options.
- `token_hash` must be unique.
- Token view is valid only when status is `active` and now <= `token_expires_at`.

## Entity: VoteOption
- **id**: uuid (PK)
- **vote_id**: uuid (FK -> Vote.id)
- **label**: text (required, 1..300)
- **position**: integer (required, >= 0)
- **created_at**: timestamptz (required)

### Validation Rules
- At least two options per vote.
- Option labels should be unique within one vote.

## Entity: VoteResponse
- **id**: uuid (PK)
- **vote_id**: uuid (FK -> Vote.id)
- **option_id**: uuid (FK -> VoteOption.id)
- **created_at**: timestamptz (required)

### Validation Rules
- `option_id` must belong to same `vote_id`.
- Responses against non-active/expired votes are rejected.

## Derived View: VoteResult
- Aggregated counts by option for one vote token.
- Fields: `vote_id`, `option_id`, `label`, `vote_count`, `percentage`.

## Relationships
- Vote 1:N VoteOption
- Vote 1:N VoteResponse
- VoteResult derives from Vote + VoteOption + VoteResponse

## State Transitions
- Vote status transitions:
  - `active` -> `archived`
  - `active` -> `deleted`
- Token accessibility transitions:
  - accessible when (`active` && not expired)
  - inaccessible when (expired || archived || deleted)
