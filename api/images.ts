import { json } from './_shared/http'

// UI currently uses Wikipedia images for places. Keep this endpoint for forward compatibility.
export default async function handler(_req: any, res: any) {
  return json(res, 200, { results: [], disabled: true, reason: 'Using Wikipedia place images' }, { 'cache-control': 'public, max-age=3600' })
}

