import { useState } from "react";
import {
  Alert,
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
import { colors, font, radius, shadow, spacing } from "@/theme";

export default function EditProfileScreen() {
  const { user, updateProfile, updatePassword } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  async function onSaveProfile() {
    if (!fullName.trim()) {
      Alert.alert("שם חסר", "הזינו שם מלא.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 9) {
      Alert.alert("טלפון לא תקין", "הזינו מספר טלפון חוקי לתשלום בביט.");
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfile(fullName.trim(), phone.trim());
      Alert.alert("נשמר", "הפרטים עודכנו בהצלחה.");
    } catch (e: any) {
      Alert.alert("שגיאה", e?.message ?? "עדכון הפרטים נכשל.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function onSavePassword() {
    if (password.length < 6) {
      Alert.alert("סיסמה קצרה", "הסיסמה חייבת להכיל לפחות 6 תווים.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("אי-התאמה", "הסיסמאות אינן תואמות.");
      return;
    }
    setSavingPassword(true);
    try {
      await updatePassword(password);
      setPassword("");
      setConfirm("");
      Alert.alert("הסיסמה עודכנה", "הסיסמה שונתה בהצלחה.");
    } catch (e: any) {
      Alert.alert("שגיאה", e?.message ?? "החלפת הסיסמה נכשלה.");
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
            <Text style={styles.readonly}>אימייל: {user?.email}</Text>
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
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  headerRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
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
});
