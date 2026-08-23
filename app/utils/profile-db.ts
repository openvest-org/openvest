import type { LocalProfile } from '~/types/profile'

const DATABASE_NAME = 'openvest'
const DATABASE_VERSION = 1
const PROFILE_STORE = 'profile'
const PROFILE_KEY = 'current'

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (!('indexedDB' in globalThis)) {
      reject(new Error('IndexedDB indisponível neste navegador.'))
      return
    }

    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(PROFILE_STORE)) {
        request.result.createObjectStore(PROFILE_STORE)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('O banco local está bloqueado por outra aba.'))
  })
}

function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function transactionDone(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}

function createStorageSnapshot(profile: LocalProfile) {
  return JSON.parse(JSON.stringify(profile)) as LocalProfile
}

export async function readLocalProfile() {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(PROFILE_STORE, 'readonly')
    const request = transaction.objectStore(PROFILE_STORE).get(PROFILE_KEY)
    return (await requestResult(request) as LocalProfile | undefined) ?? null
  } finally {
    database.close()
  }
}

export async function writeLocalProfile(profile: LocalProfile) {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(PROFILE_STORE, 'readwrite')
    transaction.objectStore(PROFILE_STORE).put(createStorageSnapshot(profile), PROFILE_KEY)
    await transactionDone(transaction)
  } finally {
    database.close()
  }
}
