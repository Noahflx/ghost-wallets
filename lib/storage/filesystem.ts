import fs from "fs"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")

let dataDirectoryAvailable: boolean | null = null

function ensureDataDirectoryExists(): boolean {
  if (dataDirectoryAvailable === false) {
    return false
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }

    dataDirectoryAvailable = true
    return true
  } catch (error) {
    console.warn(
      `Data directory ${DATA_DIR} is not writable. Falling back to in-memory storage.`,
      error,
    )
    dataDirectoryAvailable = false
    return false
  }
}

export function readJsonFile<T>(filename: string, fallback: T): T {
  if (!ensureDataDirectoryExists()) {
    return fallback
  }
  const filePath = path.join(DATA_DIR, filename)

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
  if (!ensureDataDirectoryExists()) {
    return
  }
  const filePath = path.join(DATA_DIR, filename)

  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8")
  } catch (error) {
    console.warn(`Failed to persist data to ${filename}.`, error)
    dataDirectoryAvailable = false
  }
}

export function getDataFilePath(filename: string): string {
  ensureDataDirectoryExists()
  return path.join(DATA_DIR, filename)
}
