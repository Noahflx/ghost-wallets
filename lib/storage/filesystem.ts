import fs from "fs"
import os from "os"
import path from "path"

type JsonRecord = Record<string, any>
const memoryStore: Record<string, JsonRecord> = {}

const preferredDataDir = process.env.GHOST_WALLETS_DATA_DIR
const fallbackDataDir = path.join(os.tmpdir(), "ghost-wallets-data")

let resolvedDataDir: string | null = null
let hasLoggedResolvedDir = false

function ensureDataDirectoryExists(): string {
  if (resolvedDataDir) {
    return resolvedDataDir
  }

  const candidates = preferredDataDir
    ? [preferredDataDir, fallbackDataDir]
    : [fallbackDataDir]

  for (const candidate of candidates) {
    try {
      if (!fs.existsSync(candidate)) {
        fs.mkdirSync(candidate, { recursive: true })
      }

      resolvedDataDir = candidate

      if (!hasLoggedResolvedDir) {
        console.log(`[storage] Using data directory: ${resolvedDataDir}`)
        hasLoggedResolvedDir = true
      }

      return resolvedDataDir
    } catch (error) {
      console.warn(`Failed to ensure data directory at ${candidate}.`, error)
    }
  }

  resolvedDataDir = fallbackDataDir

  if (!hasLoggedResolvedDir) {
    console.warn(
      `[storage] Falling back to in-memory storage. Unable to use directories: ${candidates.join(", ")}`,
    )
    hasLoggedResolvedDir = true
  }

  return resolvedDataDir
}

function getMemoryFallback<T>(filename: string, fallback: T): T {
  return (memoryStore[filename] as T) || fallback
}

export function readJsonFile<T>(filename: string, fallback: T): T {
  const dir = ensureDataDirectoryExists()
  const filePath = path.join(dir, filename)

  try {
    const contents = fs.readFileSync(filePath, "utf-8")
    return JSON.parse(contents) as T
  } catch (error) {
    const err = error as NodeJS.ErrnoException
    if (err?.code !== "ENOENT") {
      console.warn(`[storage] Failed to read ${filePath}. Using in-memory fallback.`, error)
    }
    return getMemoryFallback(filename, fallback)
  }
}

export function writeJsonFile(filename: string, data: unknown): void {
  const dir = ensureDataDirectoryExists()
  const filePath = path.join(dir, filename)

  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8")
    memoryStore[filename] = data as JsonRecord
  } catch (error) {
    console.warn(`[storage] Failed to write ${filePath}. Persisting in memory only.`, error)
    memoryStore[filename] = data as JsonRecord
  }
}

export function getDataFilePath(filename: string): string {
  const dir = ensureDataDirectoryExists()
  return path.join(dir, filename)
}
