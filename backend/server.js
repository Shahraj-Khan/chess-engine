
import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ENGINE = resolve(ROOT, 'dist/src/uci/uci.js')
const HOST = '127.0.0.1'
const PORT = 3001

function json(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  res.end(JSON.stringify(data))
}

function runEngine({ fen, limits, signal, handshakeOnly = false }) {
  return new Promise((resolvePromise, rejectPromise) => {
    if (!existsSync(ENGINE)) {
      rejectPromise(new Error('Engine build not found. Run npm run build first.'))
      return
    }

    if (signal?.aborted) {
      rejectPromise(new Error('Engine request aborted.'))
      return
    }

    const child = spawn(process.execPath, [ENGINE], {
      cwd: ROOT,
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    })

    const lines = createInterface({ input: child.stdout })
    let settled = false
    let engineName = 'NFamily Chess Engine'
    let depth
    let timeMs
    let stderr = ''

    const timer = setTimeout(() => {
      finish(new Error('Engine search timed out.'))
      child.kill()
    }, 60_000)

    function finish(error, result) {
      if (settled) return
      settled = true
      clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)

      if (error) rejectPromise(error)
      else resolvePromise(result)
    }

    function onAbort() {
      finish(new Error('Engine request aborted.'))
      child.kill()
    }

    signal?.addEventListener('abort', onAbort, { once: true })

    child.stderr.setEncoding('utf8')
    child.stderr.on('data', (chunk) => {
      stderr += chunk
    })

    lines.on('line', (line) => {
      if (line.startsWith('id name ')) {
        engineName = line.slice('id name '.length).trim()
      }

      if (line === 'uciok') {
        child.stdin.write('isready\n')
        return
      }

      if (line === 'readyok') {
        if (handshakeOnly) {
          finish(null, { engineName })
          child.stdin.write('quit\n')
          return
        }

        child.stdin.write(`position fen ${fen}\n`)
        const go = limits.moveTimeMs
          ? `go movetime ${limits.moveTimeMs}`
          : `go depth ${limits.depth}`

        child.stdin.write(`${go}\n`)
        return
      }

      const depthMatch = line.match(/^info depth (\d+)/)
      if (depthMatch) depth = Number(depthMatch[1])

      const timeMatch = line.match(/^info string Search time: ([\d.]+) ms/)
      if (timeMatch) timeMs = Number(timeMatch[1])

      const bestMatch = line.match(/^bestmove\s+(\S+)/)
      if (bestMatch) {
        finish(null, {
          bestMove: bestMatch[1],
          info: {
            ...(depth !== undefined ? { depth } : {}),
            ...(timeMs !== undefined ? { timeMs } : {}),
          },
        })
        child.stdin.write('quit\n')
      }
    })

    child.on('error', (error) => finish(error))

    child.on('close', (code) => {
      if (!settled) {
        finish(new Error(
          `Engine exited without a result (code ${code}). ${stderr.trim()}`
        ))
      }
    })

    child.stdin.write('uci\n')
  })
}

const server = createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/api/engine/status') {
    try {
      const result = await runEngine({ handshakeOnly: true })
      json(res, 200, { state: 'connected', engineName: result.engineName })
    } catch (error) {
      json(res, 503, {
        state: 'disconnected',
        detail: error instanceof Error ? error.message : 'Engine unavailable',
      })
    }
    return
  }

  if (req.method === 'POST' && req.url === '/api/engine/search') {
    const controller = new AbortController()
    res.on('close', () => {
      if (!res.writableEnded) controller.abort()
    })

    try {
      let body = ''
      for await (const chunk of req) {
        body += chunk
        if (body.length > 32_000) {
          json(res, 413, { error: 'Request body too large.' })
          return
        }
      }

      const request = JSON.parse(body)
      const { fen, limits } = request

      if (typeof fen !== 'string' || !limits || !Number.isInteger(limits.depth)
          || limits.depth < 1 || limits.depth > 8) {
        json(res, 400, { error: 'Invalid FEN or search limits.' })
        return
      }

      if (limits.moveTimeMs !== null &&
          (!Number.isInteger(limits.moveTimeMs) ||
           limits.moveTimeMs < 1 || limits.moveTimeMs > 10_000)) {
        json(res, 400, { error: 'Invalid move time.' })
        return
      }

      const result = await runEngine({ fen, limits, signal: controller.signal })

      if (!res.destroyed) json(res, 200, result)
    } catch (error) {
      if (!res.destroyed) {
        json(res, 500, {
          error: error instanceof Error ? error.message : 'Engine search failed.',
        })
      }
    }
    return
  }

  json(res, 404, { error: 'Not found.' })
})

server.listen(PORT, HOST, () => {
  console.log(`NFamily engine bridge listening at http://${HOST}:${PORT}`)
})
