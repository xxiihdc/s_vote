import Link from 'next/link'
import { createVoteAction } from './actions'
import { CopyResultUrlButton } from './copy-result-url-button'

interface CreateVotePageProps {
  searchParams: Promise<{ error?: string; created?: string; resultUrl?: string; tokenExpiresAt?: string }>
}

export default async function CreateVotePage({ searchParams }: CreateVotePageProps) {
  const { error, created, resultUrl, tokenExpiresAt } = await searchParams
  const hasResultUrl = created === '1' && Boolean(resultUrl)

  return (
    <main>
      <h1>Create a vote</h1>
      <p>Create an anonymous vote and share the link.</p>

      {hasResultUrl ? (
        <section aria-label="Vote created successfully">
          <p role="status">Vote created successfully.</p>
          <label htmlFor="resultUrl">Result URL</label>
          <input id="resultUrl" value={resultUrl} readOnly />
          <p>
            <Link href={resultUrl!}>Open result page</Link>
          </p>
          <CopyResultUrlButton resultUrl={resultUrl!} />
          {tokenExpiresAt ? <p>Token expires at: {new Date(tokenExpiresAt).toISOString()}</p> : null}
        </section>
      ) : null}

      {error ? <p role="alert">Unable to create vote. Please verify your input.</p> : null}

      <form action={createVoteAction}>
        <div>
          <label htmlFor="question">Question</label>
          <input id="question" name="question" required minLength={3} maxLength={1000} />
        </div>

        <div>
          <label htmlFor="options">Options (one per line)</label>
          <textarea id="options" name="options" required rows={6} />
        </div>

        <div>
          <label htmlFor="openTime">Open time (optional)</label>
          <input id="openTime" name="openTime" type="datetime-local" />
        </div>

        <div>
          <label htmlFor="closeTime">Close time (optional)</label>
          <input id="closeTime" name="closeTime" type="datetime-local" />
        </div>

        <div>
          <label htmlFor="expirationDays">Expiration days (1-30)</label>
          <input
            id="expirationDays"
            name="expirationDays"
            type="number"
            min={1}
            max={30}
            defaultValue={30}
          />
        </div>

        <div>
          <label>
            <input name="allowMultiple" type="checkbox" />
            Allow multiple selections
          </label>
        </div>

        <div>
          <label>
            <input name="requiresPassword" type="checkbox" />
            Require password for voters
          </label>
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" maxLength={255} />
        </div>

        <button type="submit">Create vote</button>
      </form>

      <p>
        <Link href="/">Back to home</Link>
      </p>
    </main>
  )
}
