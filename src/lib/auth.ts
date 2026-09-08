/**
 * שכבת אימות אחידה: משתמשת ב-Backend המדומה כשאין Supabase מוגדר,
 * ואחרת מול Supabase Auth. שני המסלולים מחזירים AppUser אחיד.
 */
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "./supabase";
import { AppUser } from "./types";
import * as mock from "./mock/mockBackend";

export const USE_MOCK = !isSupabaseConfigured;

function mapSupabaseUser(u: User | null | undefined): AppUser | null {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email ?? "",
    full_name: (u.user_metadata?.full_name as string) ?? null,
    is_admin: Boolean(u.user_metadata?.is_admin),
  };
}

export async function getCurrentUser(): Promise<AppUser | null> {
  if (USE_MOCK) return mock.getSessionUser();
  const { data } = await supabase.auth.getSession();
  return mapSupabaseUser(data.session?.user);
}

export function onAuthChange(cb: (user: AppUser | null) => void): () => void {
  if (USE_MOCK) return mock.subscribe(cb);
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    cb(mapSupabaseUser(session?.user));
  });
  return () => data.subscription.unsubscribe();
}

export async function signIn(email: string, password: string): Promise<void> {
  if (USE_MOCK) return mock.signIn(email, password);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUp(
  email: string,
  password: string,
  fullName: string,
): Promise<void> {
  if (USE_MOCK) return mock.signUp(email, password, fullName);
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  if (USE_MOCK) return mock.signOut();
  await supabase.auth.signOut();
}

/** התחברות עם Google (OAuth). עובד ב-web ובאפליקציה הנייטיבית. */
export async function signInWithGoogle(): Promise<void> {
  if (USE_MOCK) {
    throw new Error("התחברות Google זמינה רק במצב אמיתי (עם Supabase).");
  }

  // ב-web: מפנים את הדפדפן ל-Google; החזרה מטופלת ע"י detectSessionInUrl.
  if (Platform.OS === "web") {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
    return;
  }

  // בנייטיב: פותחים דפדפן מאובטח ומחליפים את הקוד ב-session.
  const redirectTo = Linking.createURL("/");
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data?.url) throw new Error("לא התקבל קישור התחברות מ-Google.");

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success" || !result.url) return;

  const code = new URL(result.url).searchParams.get("code");
  if (code) {
    const { error: exchangeErr } =
      await supabase.auth.exchangeCodeForSession(code);
    if (exchangeErr) throw exchangeErr;
  }
}
