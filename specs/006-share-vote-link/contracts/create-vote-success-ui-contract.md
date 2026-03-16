# UI Contract — Create Vote Success State

## Route
- `/votes/create`

## Inputs (from search params)
- `created`: success indicator (`"1"`)
- `voteUrl`: absolute voting URL (canonical origin from `APP_URL`)
- `resultUrl`: absolute result URL
- `tokenExpiresAt`: optional ISO datetime
- `error`: generic error marker for create flow

## Rendering Rules
1. Render success panel only when `created="1"` and both `voteUrl` + `resultUrl` are present and valid.
2. When success panel is rendered, show both fields with distinct labels:
   - Voting URL (share with voters)
   - Result URL
3. Provide two actions per link intent:
   - Open link
   - Copy link
4. If creation metadata is incomplete, suppress success panel and show generic share-link error message.
5. Existing invalid-input error behavior from create flow remains unchanged.

## URL Composition Rule
- `voteUrl` MUST be absolute and use canonical `APP_URL` origin.
- Path format for voting URL: `/votes/{voteId}`.
