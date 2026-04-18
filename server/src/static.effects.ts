// Effect shell: serve static files from the built web app.

import { join } from 'node:path'
import { type BunFile, file } from 'bun'

export async function serveStatic(req: Request, appDir: string): Promise<Response | null> {
  const url = new URL(req.url)
  let pathname = url.pathname

  // Strip leading /app so both `/` and `/app/*` map to the same dist.
  if (pathname.startsWith('/app')) pathname = pathname.slice(4) || '/'
  if (pathname === '/') pathname = '/index.html'

  const filePath = join(appDir, pathname)
  const f: BunFile = file(filePath)
  if (!(await f.exists())) {
    // SPA fallback to index.html for client routes.
    const fallback = file(join(appDir, 'index.html'))
    if (await fallback.exists()) {
      return new Response(fallback, { headers: { 'content-type': 'text/html; charset=utf-8' } })
    }
    return null
  }
  return new Response(f)
}
