// Wiring: boot the server.

import { getEnv, getLogger, getTracer } from '@unwild/lib/fp/index.ts'
import { getConfig } from './config.ts'
import { renderMonitor } from './monitor.ts'
import { handleRpc } from './rpc/dispatcher.effects.ts'
import { registerCoreMethods } from './rpc/methods.ts'
import { createRegistry } from './rpc/registry.ts'
import { serveStatic } from './static.effects.ts'

async function main(): Promise<void> {
  const envR = getEnv({ loggerLevel: 'info', tracerEnabled: false })
  if (!envR.ok) {
    console.error('env init failed', envR.error)
    process.exit(1)
  }
  const env = envR.value

  const cfgR = getConfig()
  if (!cfgR.ok) {
    console.error('config load failed', cfgR.error)
    process.exit(1)
  }
  const cfg = cfgR.value

  const logger = await getLogger(env)
  const tracer = await getTracer(env, { name: 'server-boot' })

  const registry = createRegistry()
  registerCoreMethods(registry)

  const server = Bun.serve({
    hostname: cfg.host,
    port: cfg.port,
    async fetch(req) {
      const url = new URL(req.url)

      if (url.pathname.startsWith('/api/')) {
        return handleRpc(req, { registry, logger, tracer })
      }

      if (url.pathname === '/monitor') {
        const html = renderMonitor({
          host: cfg.host,
          port: cfg.port,
          methods: registry.list(),
        })
        return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
      }

      // Static SPA (may not exist yet until `bun run build:app`).
      const staticRes = await serveStatic(req, cfg.appDir)
      if (staticRes) return staticRes

      return new Response('not found', { status: 404 })
    },
  })

  logger.info('unwild server up', { url: `http://${server.hostname}:${server.port}` })
  logger.info('routes', {
    app: `http://${server.hostname}:${server.port}/app/`,
    api: `http://${server.hostname}:${server.port}/api`,
    monitor: `http://${server.hostname}:${server.port}/monitor`,
  })

  for (const sig of ['SIGINT', 'SIGTERM'] as const) {
    process.on(sig, () => {
      logger.info(`received ${sig}, shutting down`)
      server.stop()
      tracer.close()
      logger.close()
      process.exit(0)
    })
  }
}

main().catch((e) => {
  console.error('fatal', e)
  process.exit(1)
})
