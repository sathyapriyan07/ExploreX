export async function fetchJson<T>(
  url: string,
  opts?: { method?: 'GET' | 'POST'; headers?: Record<string, string>; body?: string; timeoutMs?: number },
): Promise<T> {
  const controller = new AbortController()
  const timeoutMs = opts?.timeoutMs ?? 12_000
  const handle = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      method: opts?.method ?? 'GET',
      headers: {
        accept: 'application/json',
        ...(opts?.headers ?? {}),
      },
      body: opts?.body,
      signal: controller.signal,
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Fetch failed ${res.status}: ${text.slice(0, 200)}`)
    }
    return (await res.json()) as T
  } finally {
    clearTimeout(handle)
  }
}

