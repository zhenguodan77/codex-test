// 照片存储：放 IndexedDB（容量远大于 localStorage 的 ~5MB），
// 键为记录 id、值为压缩后的 dataURL。localStorage 只存文字索引。

const DB_NAME = 'shixu'
const STORE = 'photos'
const VERSION = 1

let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'))
      return
    }
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function store(mode: IDBTransactionMode): Promise<IDBObjectStore> {
  return openDB().then((db) => db.transaction(STORE, mode).objectStore(STORE))
}

export async function putPhoto(id: string, dataUrl: string): Promise<boolean> {
  try {
    const s = await store('readwrite')
    await new Promise<void>((res, rej) => {
      const r = s.put(dataUrl, id)
      r.onsuccess = () => res()
      r.onerror = () => rej(r.error)
    })
    return true
  } catch {
    return false
  }
}

export async function deletePhoto(id: string): Promise<void> {
  try {
    const s = await store('readwrite')
    await new Promise<void>((res) => {
      const r = s.delete(id)
      r.onsuccess = () => res()
      r.onerror = () => res()
    })
  } catch {
    /* ignore */
  }
}

/** 一次性载入所有照片：{ id: dataURL } */
export async function loadAllPhotos(): Promise<Record<string, string>> {
  try {
    const s = await store('readonly')
    const keys = await new Promise<IDBValidKey[]>((res, rej) => {
      const r = s.getAllKeys()
      r.onsuccess = () => res(r.result)
      r.onerror = () => rej(r.error)
    })
    const vals = await new Promise<string[]>((res, rej) => {
      const r = s.getAll()
      r.onsuccess = () => res(r.result as string[])
      r.onerror = () => rej(r.error)
    })
    const map: Record<string, string> = {}
    keys.forEach((k, i) => {
      map[String(k)] = vals[i]
    })
    return map
  } catch {
    return {}
  }
}

/** 导入恢复：清空后写入整批照片 */
export async function replaceAllPhotos(map: Record<string, string>): Promise<void> {
  try {
    const s = await store('readwrite')
    await new Promise<void>((res) => {
      const r = s.clear()
      r.onsuccess = () => res()
      r.onerror = () => res()
    })
    const s2 = await store('readwrite')
    for (const [id, url] of Object.entries(map)) s2.put(url, id)
  } catch {
    /* ignore */
  }
}
