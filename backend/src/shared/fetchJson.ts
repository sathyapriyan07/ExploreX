export async function fetchJson<T>(
  url: string,
  opts?: {
    headers?: Record<string, string>
    timeoutMs?: number
    method?: 'GET' | 'POST'
    body?: string
  },
): Promise<T> {
  const controller = new AbortController()
  const timeoutMs = opts?.timeoutMs ?? 10_000
  const handle = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      method: opts?.method ?? 'GET',
      headers: {
        'user-agent': 'ExploreX/1.0 (proxy)',
        accept: 'application/json',
        ...(opts?.headers ?? {}),
      },
      body: opts?.body,
      signal: controller.signal,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Fetch failed ${res.status} ${res.statusText}: ${text.slice(0, 200)}`)
    }

    return (await res.json()) as T
  } finally {
    clearTimeout(handle)
  }
}
