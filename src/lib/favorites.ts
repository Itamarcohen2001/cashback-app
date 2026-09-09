/** מעקב מקומי אחר חנויות מועדפות (❤). נשמר ב-AsyncStorage וזמין בכל המצבים. */
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "cashy_favorite_stores";

type Listener = (ids: string[]) => void;
const listeners = new Set<Listener>();
let cache: string[] | null = null;

async function read(): Promise<string[]> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

async function write(ids: string[]): Promise<void> {
  cache = ids;
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // מתעלמים משגיאות אחסון מקומי.
  }
  listeners.forEach((cb) => cb(ids));
}

export async function getFavoriteIds(): Promise<string[]> {
  return [...(await read())];
}

export async function isFavorite(storeId: string): Promise<boolean> {
  return (await read()).includes(storeId);
}

/** מוסיף/מסיר חנות מהמועדפים ומחזיר את המצב החדש (true = מועדף). */
export async function toggleFavorite(storeId: string): Promise<boolean> {
  const ids = await read();
  const exists = ids.includes(storeId);
  const next = exists ? ids.filter((id) => id !== storeId) : [storeId, ...ids];
  await write(next);
  return !exists;
}

/** מאזין לשינויים ברשימת המועדפים (לעדכון מיידי בין מסכים). */
export function subscribeFavorites(cb: Listener): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
