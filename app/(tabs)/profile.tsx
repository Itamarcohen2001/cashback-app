import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { Card, GradientCard } from "@/ui";
import { fetchPayouts } from "@/lib/cashback";
import { formatDate, formatMoney } from "@/lib/format";
import { PayoutRequest, PayoutStatus } from "@/lib/types";
import { colors, font, gradients, radius, rtl, spacing } from "@/theme";

const PAYOUT_META: Record<
  PayoutStatus,
  { label: string; color: string; bg: string }
> = {
  requested: { label: "ממתין", color: colors.warning, bg: "#FFF4E5" },
  paid: { label: "שולם", color: colors.success, bg: colors.accentLight },
  rejected: { label: "נדחה", color: colors.danger, bg: "#FFE9EB" },
};

/** אישור פעולה — Alert לא עובד ב-web, לכן משתמשים ב-window.confirm שם. */
function confirmAction(message: string): Promise<boolean> {
  if (Platform.OS === "web") {
    return Promise.resolve(window.confirm(message));
  }
  return new Promise((resolve) => {
    Alert.alert("אישור", message, [
      { text: "ביטול", style: "cancel", onPress: () => resolve(false) },
      { text: "אישור", style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}

export default function ProfileScreen() {
  const { user, signOut, deleteAccount } = useAuth();
  const router = useRouter();
  const fullName = user?.full_name || "משתמש";

  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loadingPayouts, setLoadingPayouts] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!user) return;
      setLoadingPayouts(true);
      fetchPayouts(user.id)
        .then((rows) => active && setPayouts(rows))
        .catch(() => active && setPayouts([]))
        .finally(() => active && setLoadingPayouts(false));
      return () => {
        active = false;
      };
    }, [user?.id]),
  );

  async function onDeleteAccount() {
    const ok = await confirmAction(
      "מחיקת החשבון היא פעולה בלתי הפיכה. כל הנתונים והקאשבק שלכם יימחקו. להמשיך?",
    );
    if (!ok) return;
    try {
      await deleteAccount();
    } catch (e: any) {
      const msg = e?.message ?? "מחיקת החשבון נכשלה. נסו שוב מאוחר יותר.";
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert("שגיאה", msg);
    }
  }

  async function onSignOut() {
    const ok = await confirmAction("להתנתק מהחשבון?");
    if (ok) signOut();
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>הפרופיל שלי</Text>

        <GradientCard colors={gradients.primary as unknown as string[]} glow>
          <View style={styles.userRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{fullName.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1, alignItems: rtl.start }}>
              <Text style={styles.name}>{fullName}</Text>
              <Text style={styles.email}>{user?.email}</Text>
              {user?.phone ? (
                <Text style={styles.email}>{user.phone}</Text>
              ) : null}
              {user?.is_admin ? (
                <View style={styles.adminTag}>
                  <Ionicons
                    name="shield-checkmark"
                    size={12}
                    color={colors.textInverse}
                  />
                  <Text style={styles.adminTagText}>מנהל</Text>
                </View>
              ) : null}
            </View>
          </View>
        </GradientCard>

        {/* היסטוריית משיכות */}
        <Card style={{ gap: spacing.md }}>
          <Text style={styles.infoTitle}>משיכות כספים קודמות</Text>
          {loadingPayouts ? (
            <ActivityIndicator color={colors.primary} />
          ) : payouts.length === 0 ? (
            <View style={styles.emptyRow}>
              <Ionicons
                name="wallet-outline"
                size={20}
                color={colors.textMuted}
              />
              <Text style={styles.emptyText}>עדיין לא ביצעתם משיכות.</Text>
            </View>
          ) : (
            payouts.map((p) => {
              const meta = PAYOUT_META[p.status];
              return (
                <View key={p.id} style={styles.payoutRow}>
                  <View
                    style={[styles.statusPill, { backgroundColor: meta.bg }]}
                  >
                    <Text style={[styles.statusText, { color: meta.color }]}>
                      {meta.label}
                    </Text>
                  </View>
                  <View style={{ flex: 1, alignItems: rtl.start }}>
                    <Text style={styles.payoutAmount}>
                      {formatMoney(p.amount)}
                    </Text>
                    <Text style={styles.payoutDate}>
                      {formatDate(p.created_at)}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </Card>

        {/* חשבון */}
        <View style={{ gap: spacing.sm }}>
          <Text style={styles.groupLabel}>חשבון</Text>
          <Card style={{ gap: 0, paddingVertical: spacing.xs }}>
            <SettingRow
              icon="options-outline"
              label="פאנל ניהול"
              onPress={() => router.push("/admin")}
              hidden={!user?.is_admin}
            />
            <SettingRow
              icon="create-outline"
              label="עריכת פרופיל"
              onPress={() => router.push("/edit-profile")}
              last
            />
          </Card>
        </View>

        {/* מידע ותמיכה */}
        <View style={{ gap: spacing.sm }}>
          <Text style={styles.groupLabel}>מידע ותמיכה</Text>
          <Card style={{ gap: 0, paddingVertical: spacing.xs }}>
            <SettingRow
              icon="help-circle-outline"
              label="תמיכה ושאלות נפוצות"
              onPress={() => router.push("/support")}
            />
            <SettingRow
              icon="shield-checkmark-outline"
              label="מדיניות פרטיות"
              onPress={() => router.push("/privacy")}
            />
            <SettingRow
              icon="document-text-outline"
              label="תנאי שימוש"
              onPress={() => router.push("/terms")}
              last
            />
          </Card>
        </View>

        {/* פעולות חשבון */}
        <Card style={{ gap: 0, paddingVertical: spacing.xs }}>
          <SettingRow
            icon="trash-outline"
            label="מחיקת חשבון"
            onPress={onDeleteAccount}
            danger
          />
          <SettingRow
            icon="log-out-outline"
            label="יציאה"
            onPress={onSignOut}
            danger
            last
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({
  icon,
  label,
  onPress,
  danger,
  hidden,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
  hidden?: boolean;
  last?: boolean;
}) {
  if (hidden) return null;
  const tint = danger ? colors.danger : colors.text;
  return (
    <Pressable
      style={[styles.settingRow, !last && styles.settingDivider]}
      onPress={onPress}
    >
      <Ionicons name="chevron-back" size={18} color={colors.textMuted} />
      <Text style={[styles.settingLabel, { color: tint }]}>{label}</Text>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={20} color={tint} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 130 },
  title: {
    fontSize: font.xxxl,
    fontWeight: "900",
    color: colors.text,
    textAlign: "right",
  },
  userRow: { flexDirection: rtl.row, alignItems: "center", gap: spacing.md },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: font.xxl,
    fontWeight: "900",
    color: colors.textInverse,
  },
  name: {
    fontSize: font.xxl,
    fontWeight: "900",
    color: colors.textInverse,
    textAlign: "right",
  },
  email: {
    fontSize: font.md,
    color: "#EDEBFF",
    marginTop: 2,
    textAlign: "right",
  },
  adminTag: {
    flexDirection: rtl.row,
    alignItems: "center",
    gap: 4,
    marginTop: spacing.sm,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
  },
  adminTagText: {
    color: colors.textInverse,
    fontSize: font.sm,
    fontWeight: "800",
  },
  infoTitle: {
    fontSize: font.lg,
    fontWeight: "800",
    color: colors.text,
    textAlign: "right",
  },
  groupLabel: {
    fontSize: font.sm,
    fontWeight: "800",
    color: colors.textMuted,
    textAlign: "right",
    marginStart: spacing.xs,
  },
  // משיכות
  emptyRow: { flexDirection: rtl.row, alignItems: "center", gap: spacing.sm },
  emptyText: { fontSize: font.md, color: colors.textMuted, textAlign: "right" },
  payoutRow: { flexDirection: rtl.row, alignItems: "center", gap: spacing.md },
  statusPill: {
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  statusText: { fontSize: font.sm, fontWeight: "800" },
  payoutAmount: {
    fontSize: font.lg,
    fontWeight: "800",
    color: colors.text,
    textAlign: "right",
  },
  payoutDate: {
    fontSize: font.sm,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: "right",
  },
  // צעדים
  stepRow: { flexDirection: rtl.row, alignItems: "center", gap: spacing.md },
  stepIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: {
    flex: 1,
    fontSize: font.md,
    color: colors.text,
    textAlign: "right",
  },
  // הגדרות
  settingRow: {
    flexDirection: rtl.row,
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  settingDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  settingLabel: {
    flex: 1,
    fontSize: font.md,
    fontWeight: "700",
    textAlign: "right",
  },
});
