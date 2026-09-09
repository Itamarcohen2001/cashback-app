/** מעקב מקומי אחר חנויות שנצפו/נעשה בהן שימוש לאחרונה (לקרוסלת "המומלצות שלך"). */
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "cashy_recent_stores";
const MAX = 12;

export async function addRecentStore(storeId: string): Promise<void> {
  try {
    const ids = await getRecentStoreIds();
    const next = [storeId, ...ids.filter((id) => id !== storeId)].slice(0, MAX);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // מתעלמים משגיאות אחסון מקומי.
  }
}

export async function getRecentStoreIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}
