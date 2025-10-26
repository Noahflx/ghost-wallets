// lib/data-store.ts
type JsonRecord = Record<string, any>

const memoryStore: Record<string, JsonRecord> = {}

export function readJsonFile<T>(filename: string, fallback: T): T {
  return (memoryStore[filename] as T) || fallback
}

export function writeJsonFile(filename: string, data: unknown): void {
  memoryStore[filename] = data as JsonRecord
}

export function getDataFilePath(filename: string): string {
  return filename // just a stub so existing imports don’t break
}
