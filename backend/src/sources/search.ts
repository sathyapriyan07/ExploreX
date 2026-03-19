import { fetchJson } from '../shared/fetchJson.js'

type MediaWikiSearchResponse = {
  query?: {
    search?: Array<{
      title: string
      pageid: number
      snippet?: string
      wordcount?: number
      timestamp?: string
    }>
  }
}

export type PlaceSearchResult = {
  title: string
  pageId: number
  snippet: string | null
}

export async function searchPlaces(query: string): Promise<{ results: PlaceSearchResult[] }> {
  const q = query.trim()
  const url =
    'https://en.wikipedia.org/w/api.php?' +
    new URLSearchParams({
      action: 'query',
      list: 'search',
      format: 'json',
      origin: '*',
      srlimit: '10',
      srsearch: q,
    }).toString()

  const data = await fetchJson<MediaWikiSearchResponse>(url, { timeoutMs: 10_000 })
  const results =
    data.query?.search?.map((r) => ({
      title: r.title,
      pageId: r.pageid,
      snippet: r.snippet ?? null,
    })) ?? []

  return { results }
}

