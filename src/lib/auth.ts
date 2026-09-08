/**
 * שכבת אימות אחידה: משתמשת ב-Backend המדומה כשאין Supabase מוגדר,
 * ואחרת מול Supabase Auth. שני המסלולים מחזירים AppUser אחיד.
 */
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
