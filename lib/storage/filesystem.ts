import fs from "fs"
import os from "os"
import path from "path"

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

export function readJsonFile<T>(filename: string, fallback: T): T {
  const dir = ensureDataDirectoryExists()
  const filePath = path.join(dir, filename)

  if (!fs.existsSync(filePath)) {
    return fallback
  }

  try {
    const raw = fs.readFileSync(filePath, "utf8")
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch (error) {
    console.warn(`Failed to read persisted data from ${filename}. Using fallback.`, error)
    return fallback
  }
}

export function writeJsonFile(filename: string, data: unknown): void {
  const dir = ensureDataDirectoryExists()
  const filePath = path.join(dir, filename)

  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8")
  } catch (error) {
    console.warn(`Failed to persist data to ${filename}.`, error)
  }
}

export function getDataFilePath(filename: string): string {
  const dir = ensureDataDirectoryExists()
  return path.join(dir, filename)
}
