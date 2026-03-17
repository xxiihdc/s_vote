'use client'

const STORAGE_PREFIX = 's-vote:protected-password:v1:'
const KEY_MATERIAL_PREFIX = 's-vote:browser-passphrase:v1:'
const PBKDF2_ITERATIONS = 120000

interface StoredPasswordRecord {
  cipherText: string
  iv: string
  salt: string
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary)
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

function getStorageKey(voteId: string): string {
  return `${STORAGE_PREFIX}${voteId}`
}

async function deriveEncryptionKey(voteId: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const material = `${KEY_MATERIAL_PREFIX}${window.location.origin}:${voteId}`
  const keyMaterial = await window.crypto.subtle.importKey('raw', encoder.encode(material), 'PBKDF2', false, [
    'deriveKey',
  ])

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function saveStoredVotePassword(voteId: string, password: string): Promise<void> {
  if (!password.trim() || typeof window === 'undefined' || !window.crypto?.subtle) {
    return
  }

  const encoder = new TextEncoder()
  const iv = window.crypto.getRandomValues(new Uint8Array(12))
  const salt = window.crypto.getRandomValues(new Uint8Array(16))
  const key = await deriveEncryptionKey(voteId, salt)
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encoder.encode(password)
  )

  const payload: StoredPasswordRecord = {
    cipherText: toBase64(new Uint8Array(encrypted)),
    iv: toBase64(iv),
    salt: toBase64(salt),
  }

  window.localStorage.setItem(getStorageKey(voteId), JSON.stringify(payload))
}

export async function readStoredVotePassword(voteId: string): Promise<string | null> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    return null
  }

  const raw = window.localStorage.getItem(getStorageKey(voteId))
  if (!raw) {
    return null
  }

  try {
    const payload = JSON.parse(raw) as StoredPasswordRecord
    if (!payload.cipherText || !payload.iv || !payload.salt) {
      clearStoredVotePassword(voteId)
      return null
    }

    const iv = fromBase64(payload.iv)
    const salt = fromBase64(payload.salt)
    const cipherText = fromBase64(payload.cipherText)
    const key = await deriveEncryptionKey(voteId, salt)
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      cipherText
    )

    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
  } catch {
    clearStoredVotePassword(voteId)
    return null
  }
}

export function clearStoredVotePassword(voteId: string): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(getStorageKey(voteId))
}