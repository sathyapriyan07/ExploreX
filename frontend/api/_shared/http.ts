export function json(res: any, status: number, body: unknown, headers?: Record<string, string>) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', headers?.['cache-control'] ?? 'no-store')
  for (const [k, v] of Object.entries(headers ?? {})) {
    if (k.toLowerCase() === 'cache-control') continue
    res.setHeader(k, v)
  }
  res.end(JSON.stringify(body))
}

export function badRequest(res: any, message = 'Invalid request') {
  return json(res, 400, { error: message })
}

export function serverError(res: any, message = 'Server error') {
  return json(res, 500, { error: message })
}

export function getIp(req: any) {
  const xf = req.headers?.['x-forwarded-for']
  const raw = Array.isArray(xf) ? xf[0] : xf
  if (typeof raw === 'string' && raw.length) return raw.split(',')[0]!.trim()
  return req.socket?.remoteAddress ?? 'unknown'
}

