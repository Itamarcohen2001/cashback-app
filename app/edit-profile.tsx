import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { Button, Card, Input } from "@/ui";
import { colors, font, radius, rtl, shadow, spacing } from "@/theme";

type Msg = { text: string; ok: boolean } | null;

export default function EditProfileScreen() {
  const { user, updateProfile, updatePassword } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<Msg>(null);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<Msg>(null);

  async function onSaveProfile() {
    setProfileMsg(null);
    if (!fullName.trim()) {
      setProfileMsg({ text: "הזינו שם מלא.", ok: false });
      return;
    }
    if (!/^05\d{8}$/.test(phone.replace(/\D/g, ""))) {
      setProfileMsg({
        text: "מספר הטלפון חייב להכיל 10 ספרות ולהתחיל ב-05 (לתשלום בביט).",
        ok: false,
      });
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfile(fullName.trim(), phone.trim());
      setProfileMsg({ text: "הפרטים עודכנו בהצלחה ✓", ok: true });
    } catch (e: any) {
      setProfileMsg({ text: e?.message ?? "עדכון הפרטים נכשל.", ok: false });
    } finally {
      setSavingProfile(false);
    }
  }

  async function onSavePassword() {
    setPwdMsg(null);
    if (password.length < 6) {
      setPwdMsg({ text: "הסיסמה חייבת להכיל לפחות 6 תווים.", ok: false });
      return;
    }
    if (password !== confirm) {
      setPwdMsg({ text: "הסיסמאות אינן תואמות.", ok: false });
      return;
    }
    setSavingPassword(true);
    try {
      await updatePassword(password);
      setPassword("");
      setConfirm("");
      setPwdMsg({ text: "הסיסמה שונתה בהצלחה ✓", ok: true });
    } catch (e: any) {
      setPwdMsg({ text: e?.message ?? "החלפת הסיסמה נכשלה.", ok: false });
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-forward" size={22} color={colors.text} />
            </Pressable>
            <Text style={styles.title}>עריכת פרופיל</Text>
          </View>

          <Card style={{ gap: spacing.lg }}>
            <Text style={styles.sectionTitle}>פרטים אישיים</Text>
            <Input label="שם מלא" value={fullName} onChangeText={setFullName} />
            <Input
              label="טלפון (לתשלום בביט)"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="050-0000000"
            />
            <Input
              label="אימייל (לא ניתן לעריכה)"
              value={user?.email ?? ""}
              editable={false}
            />
            {profileMsg ? (
              <Text style={profileMsg.ok ? styles.ok : styles.err}>
                {profileMsg.text}
              </Text>
            ) : null}
            <Button
              label="שמירת פרטים"
              onPress={onSaveProfile}
              loading={savingProfile}
            />
          </Card>

          <Card style={{ gap: spacing.lg }}>
            <Text style={styles.sectionTitle}>החלפת סיסמה</Text>
            <Input
              label="סיסמה חדשה"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="לפחות 6 תווים"
            />
            <Input
              label="אימות סיסמה"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              placeholder="הקלידו שוב"
            />
            {pwdMsg ? (
              <Text style={pwdMsg.ok ? styles.ok : styles.err}>
                {pwdMsg.text}
              </Text>
            ) : null}
            <Button
              label="עדכון סיסמה"
              variant="secondary"
              onPress={onSavePassword}
              loading={savingPassword}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  headerRow: { flexDirection: rtl.row, alignItems: "center", gap: spacing.sm },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.sm,
  },
  title: {
    fontSize: font.xxl,
    fontWeight: "900",
    color: colors.text,
    textAlign: "right",
  },
  sectionTitle: {
    fontSize: font.lg,
    fontWeight: "800",
    color: colors.text,
    textAlign: "right",
  },
  readonly: { fontSize: font.sm, color: colors.textMuted, textAlign: "right" },
  ok: {
    fontSize: font.sm,
    color: colors.success,
    textAlign: "right",
    fontWeight: "700",
  },
  err: {
    fontSize: font.sm,
    color: colors.danger,
    textAlign: "right",
    fontWeight: "700",
  },
});
