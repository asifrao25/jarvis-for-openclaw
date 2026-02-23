const STORAGE_KEY = 'openclaw-auth';

export function saveAuth(password) {
  localStorage.setItem(STORAGE_KEY, password);
}

export function getAuth() {
  return localStorage.getItem(STORAGE_KEY);
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('openclaw-lastSeq');
}

export function isLoggedIn() {
  return !!localStorage.getItem(STORAGE_KEY);
}
