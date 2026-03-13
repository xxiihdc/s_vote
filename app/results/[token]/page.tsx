import { getEnv } from '@/lib/env'
import { TokenResultsClient } from './results-client'

interface TokenResultPageProps {
  params: Promise<{ token: string }>
}

export default async function TokenResultPage({ params }: TokenResultPageProps) {
  const { token } = await params
  const env = getEnv()

  return (
    <main>
      <TokenResultsClient token={token} refreshIntervalMs={env.RESULT_TOKEN_REFRESH_INTERVAL_MS} />
    </main>
  )
}
