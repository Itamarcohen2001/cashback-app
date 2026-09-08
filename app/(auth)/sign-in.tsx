import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { isSupabaseConfigured } from "@/lib/supabase";
import { Button, Card, Input } from "@/ui";
import { colors, font, spacing } from "@/theme";

export default function SignIn() {
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (e: any) {
      setError("התחברות נכשלה. בדקו את הפרטים ונסו שוב.");
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      setError(e?.message ?? "התחברות Google נכשלה.");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <View style={styles.logoBadge}>
              <Ionicons name="wallet" size={34} color={colors.textInverse} />
            </View>
            <Text style={styles.logo}>CashyCash</Text>
            <Text style={styles.tagline}>קונים כרגיל, מקבלים כסף בחזרה.</Text>
          </View>

          {!isSupabaseConfigured && (
            <Card style={styles.warn}>
              <Text style={styles.warnTitle}>מצב דמו פעיל 🧪</Text>
              <Text style={styles.warnText}>
                האפליקציה רצה עם נתונים מדומים (ללא Supabase). התחברו עם:{"\n"}
                משתמש: demo@cashy.app / 123456{"\n"}
                מנהל: admin@cashy.app / admin123
              </Text>
            </Card>
          )}

          <Card style={{ gap: spacing.lg }}>
            <Text style={styles.title}>התחברות</Text>
            <Input
              label="אימייל"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
            />
            <Input
              label="סיסמה"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button label="התחברות" onPress={onSubmit} loading={loading} />
            <View style={styles.divider}>
              <View style={styles.divLine} />
              <Text style={styles.divText}>או</Text>
              <View style={styles.divLine} />
            </View>
            <Button
              label="המשך עם Google"
              variant="secondary"
              onPress={onGoogle}
              loading={googleLoading}
              icon={
                <Ionicons name="logo-google" size={18} color={colors.primary} />
              }
            />
            <Link href="/(auth)/sign-up" style={styles.link}>
              אין לכם חשבון? הרשמה
            </Link>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: {
    padding: spacing.xl,
    gap: spacing.xl,
    flexGrow: 1,
    justifyContent: "center",
  },
  hero: { alignItems: "center", gap: spacing.sm },
  logoBadge: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  logo: { fontSize: font.xxxl, fontWeight: "900", color: colors.text },
  tagline: { fontSize: font.md, color: colors.textMuted },
  title: {
    fontSize: font.xl,
    fontWeight: "800",
    color: colors.text,
    textAlign: "right",
  },
  error: { color: colors.danger, textAlign: "right" },
  divider: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  divLine: { flex: 1, height: 1, backgroundColor: colors.border },
  divText: { color: colors.textMuted, fontSize: font.sm, fontWeight: "600" },
  link: {
    color: colors.primary,
    textAlign: "center",
    fontWeight: "700",
    fontSize: font.md,
  },
  warn: { backgroundColor: "#FEF3C7", borderColor: "#FCD34D" },
  warnTitle: {
    color: "#92400E",
    textAlign: "right",
    fontWeight: "800",
    fontSize: font.md,
  },
  warnText: { color: "#92400E", textAlign: "right" },
});
