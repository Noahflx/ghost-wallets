import { mkdirSync, readFileSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import path from "path"

type JsonRecord = Record<string, any>

const memoryStore: Record<string, JsonRecord> = {}

let resolvedDataDirectory: string | null | undefined

function resolveWritableDataDirectory(): string | null {
  if (resolvedDataDirectory !== undefined) {
    return resolvedDataDirectory
  }

  const preferred = process.env.GHOST_WALLETS_DATA_DIR
    ? path.resolve(process.env.GHOST_WALLETS_DATA_DIR)
    : path.join(process.cwd(), "data")

  const fallback = path.join(tmpdir(), "ghost-wallets")

  for (const candidate of [preferred, fallback]) {
    try {
      mkdirSync(candidate, { recursive: true })
      resolvedDataDirectory = candidate
      return resolvedDataDirectory
    } catch (error) {
      // Ignore write failures – we'll fall back to in-memory storage below.
    }
  }

  resolvedDataDirectory = null
  return resolvedDataDirectory
}

function getMemoryFallback<T>(filename: string, fallback: T): T {
  return (memoryStore[filename] as T) || fallback
}

export function readJsonFile<T>(filename: string, fallback: T): T {
  const dataDir = resolveWritableDataDirectory()

  if (!dataDir) {
    return getMemoryFallback(filename, fallback)
  }

  const filePath = path.join(dataDir, filename)

  try {
    const contents = readFileSync(filePath, "utf-8")
    return JSON.parse(contents) as T
  } catch (error) {
    return getMemoryFallback(filename, fallback)
  }
}

export function writeJsonFile(filename: string, data: unknown): void {
  const dataDir = resolveWritableDataDirectory()

  if (!dataDir) {
    memoryStore[filename] = data as JsonRecord
    return
  }

  const filePath = path.join(dataDir, filename)

  try {
    writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8")
    memoryStore[filename] = data as JsonRecord
  } catch (error) {
    memoryStore[filename] = data as JsonRecord
  }
}

export function getDataFilePath(filename: string): string {
  const dataDir = resolveWritableDataDirectory()
  return dataDir ? path.join(dataDir, filename) : filename
}
