import { spawn } from 'node:child_process'
import { config } from './config'

interface CommandOptions {
  cwd?: string
  env?: NodeJS.ProcessEnv
  timeoutMs?: number
  input?: string
  onData?: (chunk: string) => void
}

interface CommandResult {
  stdout: string
  stderr: string
  code: number | null
}

export function runCommand(
  command: string,
  args: string[],
  options: CommandOptions = {}
): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      shell: false
    })

    let stdout = ''
    let stderr = ''
    let timeoutId: NodeJS.Timeout | undefined

    if (options.timeoutMs) {
      timeoutId = setTimeout(() => {
        child.kill('SIGKILL')
      }, options.timeoutMs)
    }

    child.stdout.on('data', (data) => {
      const chunk = data.toString()
      stdout += chunk
      options.onData?.(chunk)
    })

    child.stderr.on('data', (data) => {
      const chunk = data.toString()
      stderr += chunk
      options.onData?.(chunk)
    })

    child.on('error', (error) => {
      if (timeoutId) clearTimeout(timeoutId)
      reject(error)
    })

    child.on('close', (code) => {
      if (timeoutId) clearTimeout(timeoutId)
      if (code === 0) {
        resolve({ stdout, stderr, code })
        return
      }
      const error = new Error(
        `Command failed (${command} ${args.join(' ')}): ${stderr || stdout}`
      )
      ;(error as any).stdout = stdout
      ;(error as any).stderr = stderr
      ;(error as any).code = code
      reject(error)
    })

    if (options.input) {
      child.stdin.write(options.input)
      child.stdin.end()
    }
  })
}

export function runOpenClaw(args: string[], options: CommandOptions = {}) {
  // Explicitly pass OPENCLAW_STATE_DIR so the CLI uses the exact resolved path.
  // Without this, the CLI may interpret OPENCLAW_HOME as a parent directory and
  // append ".openclaw" to it — causing double-nesting when OPENCLAW_HOME is
  // already set to the state directory (e.g. /root/.openclaw → /root/.openclaw/.openclaw).
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    OPENCLAW_STATE_DIR: config.openclawStateDir,
    ...options.env,
  }
  return runCommand(config.openclawBin, args, {
    ...options,
    env,
    cwd: options.cwd || config.openclawStateDir || process.cwd()
  })
}

export function runClawdbot(args: string[], options: CommandOptions = {}) {
  return runCommand(config.clawdbotBin, args, {
    ...options,
    cwd: options.cwd || config.openclawStateDir || process.cwd()
  })
}

/**
 * Run openclaw command with retry on transient failures.
 * Retries up to `maxAttempts` times with exponential backoff.
 */
export async function runOpenClawWithRetry(
  args: string[],
  options: CommandOptions & { maxAttempts?: number; retryDelayMs?: number } = {}
): Promise<CommandResult> {
  const { maxAttempts = 3, retryDelayMs = 3000, ...cmdOptions } = options
  let lastError: Error | undefined

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await runOpenClaw(args, cmdOptions)
    } catch (err: any) {
      lastError = err
      if (attempt < maxAttempts) {
        const delay = retryDelayMs * Math.pow(2, attempt - 1) // 3s, 6s, 12s
        console.warn(`[runOpenClawWithRetry] Attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms:`, err.message?.slice(0, 100))
        await new Promise(r => setTimeout(r, delay))
      }
    }
  }

  throw lastError
}
