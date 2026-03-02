/** Token store: memory + localStorage fallback (cookies often fail on Vercel) */
const STORAGE_KEY = "catercalc_token";

let token: string | null = null;

function readFromStorage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(t: string | null) {
  token = t;
  try {
    if (t) localStorage.setItem(STORAGE_KEY, t);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function getAuthToken(): string | null {
  if (token) return token;
  token = readFromStorage();
  return token;
}
