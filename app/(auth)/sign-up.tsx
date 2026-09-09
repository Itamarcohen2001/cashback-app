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
import { Button, Card, Input } from "@/ui";
import { colors, font, spacing } from "@/theme";

export default function SignUp() {
  const { signUp, signInWithGoogle } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    setNotice(null);
    if (password.length < 6) {
      setError("הסיסמה חייבת להכיל לפחות 6 תווים.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 9) {
      setError("הזינו מספר טלפון חוקי (לתשלום הקאשבק בביט).");
      return;
    }
    setLoading(true);
    try {
      await signUp(email.trim(), password, fullName.trim(), phone.trim());
      setNotice("נשלח אימייל אימות. אשרו אותו ואז התחברו.");
    } catch (e: any) {
      setError("ההרשמה נכשלה. ייתכן שהאימייל כבר בשימוש.");
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    setError(null);
    setNotice(null);
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
            <Text style={styles.tagline}>הצטרפו והתחילו לצבור קאשבק.</Text>
          </View>

          <Card style={{ gap: spacing.lg }}>
            <Text style={styles.title}>הרשמה</Text>
            <Input
              label="שם מלא"
              value={fullName}
              onChangeText={setFullName}
              placeholder="ישראל ישראלי"
            />
            <Input
              label="אימייל"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
            />
            <Input
              label="טלפון (לתשלום בביט)"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="050-0000000"
            />
            <Input
              label="סיסמה"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="לפחות 6 תווים"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {notice ? <Text style={styles.notice}>{notice}</Text> : null}
            <Button label="יצירת חשבון" onPress={onSubmit} loading={loading} />
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
            <Link href="/(auth)/sign-in" style={styles.link}>
              כבר יש לכם חשבון? התחברות
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
  notice: { color: colors.success, textAlign: "right" },
  divider: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  divLine: { flex: 1, height: 1, backgroundColor: colors.border },
  divText: { color: colors.textMuted, fontSize: font.sm, fontWeight: "600" },
  link: {
    color: colors.primary,
    textAlign: "center",
    fontWeight: "700",
    fontSize: font.md,
  },
});
