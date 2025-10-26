import fs from "fs"
import os from "os"
import path from "path"

type JsonRecord = Record<string, any>
const memoryStore: Record<string, JsonRecord> = {}

let dataDir = process.env.GHOST_WALLETS_DATA_DIR || path.join(process.cwd(), "data")

function ensureDataDirectoryExists(): string {
  const fallbackDir = path.join(os.tmpdir(), "ghost-wallets-data")

  for (const candidate of [dataDir, fallbackDir]) {
    try {
      if (!fs.existsSync(candidate)) {
        fs.mkdirSync(candidate, { recursive: true })
      }
      dataDir = candidate
      return dataDir
    } catch (error) {
      console.warn(`Failed to ensure data directory at ${candidate}.`, error)
    }
  }

  return dataDir
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
    memoryStore[filename] = data as JsonRecord
  }
}

export function getDataFilePath(filename: string): string {
  const dir = ensureDataDirectoryExists()
  return path.join(dir, filename)
}
