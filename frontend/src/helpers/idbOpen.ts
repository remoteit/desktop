// An IndexedDB open that always settles. `indexedDB.open` can sit forever — blocked by another tab's connection, or a
// browser whose storage is wedged — and anything awaiting it waits with it; on the boot path that is a splash with no
// way out. Past `ms` (or on `blocked`) it rejects, and a connection that opens after the deadline is closed, not kept.
export const IDB_OPEN_TIMEOUT_MS = 5000

export function idbOpen(
  factory: IDBFactory,
  name: string,
  version: number,
  upgrade: (db: IDBDatabase) => void,
  ms: number = IDB_OPEN_TIMEOUT_MS
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let settled = false
    const fail = (error: unknown) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      reject(error)
    }
    const timer = setTimeout(() => fail(new Error(`IndexedDB ${name} did not open within ${ms} ms`)), ms)
    const open = factory.open(name, version)
    open.onupgradeneeded = () => upgrade(open.result)
    open.onblocked = () => fail(new Error(`IndexedDB ${name} is blocked by another connection`))
    open.onerror = () => fail(open.error)
    open.onsuccess = () => {
      if (settled) return open.result.close()
      settled = true
      clearTimeout(timer)
      resolve(open.result)
    }
  })
}
