// Pure: build the monitor HTML page.

import type { MethodKind } from '@unwild/lib/rpc/index.ts'

export function renderMonitor(info: {
  host: string
  port: number
  methods: Array<{ name: string; kind: MethodKind }>
}): string {
  const items = info.methods
    .map(
      (m) =>
        `<li><span class="verb ${m.kind}">${m.kind === 'read' ? 'GET' : 'POST'}</span> <code>/api/${m.name}</code></li>`,
    )
    .join('')
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Unwild — Monitor</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; color: #222; }
    h1 { font-weight: 600; }
    code { background: #f4f4f4; padding: 0.1rem 0.3rem; border-radius: 3px; }
    .ok { color: #0a7a0a; }
    ul { list-style: none; padding: 0; }
    li { padding: 0.2rem 0; }
    .verb { display: inline-block; width: 3rem; font-size: 0.75rem; font-weight: 600; color: #fff; padding: 0.05rem 0.3rem; border-radius: 3px; text-align: center; margin-right: 0.4rem; }
    .verb.read { background: #3b6ea5; }
    .verb.write { background: #b05b3b; }
  </style>
</head>
<body>
  <h1>Unwild Monitor</h1>
  <p class="ok">● running on ${info.host}:${info.port}</p>
  <h2>RPC methods</h2>
  <ul>${items}</ul>
  <p>App: <a href="/app/">/app/</a> · API: <code>/api/{method}</code> (GET for reads, POST for mutations)</p>
</body>
</html>`
}
