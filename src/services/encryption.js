// Encryption service using Web Crypto API
// Derives an AES-GCM 256-bit key from the user password

const SALT = new TextEncoder().encode('openclaw-jarvis-pwa-salt'); // In a multi-user app, this should be unique
const ITERATIONS = 100000;

let cachedKey = null;

async function getKey(password) {
  if (cachedKey) return cachedKey;
  if (!password) return null;

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  cachedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: SALT,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  return cachedKey;
}

export async function encrypt(text, password) {
  try {
    const key = await getKey(password);
    if (!key) return text;

    const enc = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      enc.encode(text)
    );

    // Combine IV and encrypted data into a single base64 string
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  } catch (err) {
    console.error('[Encryption] Failed:', err);
    return text;
  }
}

export async function decrypt(base64Data, password) {
  try {
    const key = await getKey(password);
    if (!key) return base64Data;

    const combined = new Uint8Array(
      atob(base64Data)
        .split('')
        .map(c => c.charCodeAt(0))
    );

    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  } catch (err) {
    // If decryption fails, it might be plain text or a different password
    console.warn('[Encryption] Decryption failed, returning raw data');
    return base64Data;
  }
}

export function clearEncryptionCache() {
  cachedKey = null;
}
