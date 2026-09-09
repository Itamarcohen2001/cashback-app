import { useCallback, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import {
  adminFetchPayouts,
  adminFetchPendingTransactions,
  adminMarkPayoutPaid,
  adminSetTransactionStatus,
} from "@/lib/cashback";
import { formatDate, formatMoney } from "@/lib/format";
import { CashbackTransaction, PayoutRequest, UserBrief } from "@/lib/types";
import { Badge, Button, Card } from "@/ui";
import { colors, font, radius, spacing } from "@/theme";

export default function AdminScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState<CashbackTransaction[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [txns, po] = await Promise.all([
        adminFetchPendingTransactions(),
        adminFetchPayouts(),
      ]);
      setPending(txns);
      setPayouts(po);
    } catch (e) {
      Alert.alert("שגיאה", "לא הצלחנו לטעון נתוני ניהול.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function setStatus(id: string, status: "confirmed" | "rejected") {
    setBusyId(id);
    try {
      await adminSetTransactionStatus(id, status);
      await load();
    } catch (e) {
      Alert.alert("שגיאה", "הפעולה נכשלה.");
    } finally {
      setBusyId(null);
    }
  }

  async function markPaid(id: string) {
    setBusyId(id);
    try {
      await adminMarkPayoutPaid(id);
      await load();
    } catch (e) {
      Alert.alert("שגיאה", "הפעולה נכשלה.");
    } finally {
      setBusyId(null);
    }
  }

  if (!user?.is_admin) {
    return (
      <SafeAreaView style={styles.safe}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.denied}>אין לך הרשאת גישה לפאנל הניהול.</Text>
      </SafeAreaView>
    );
  }

  const requestedPayouts = payouts.filter((p) => p.status === "requested");

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <FlatList
        data={pending}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={load}
        ListHeaderComponent={
          <View style={{ gap: spacing.lg }}>
            <View style={styles.headerRow}>
              <Ionicons
                name="chevron-forward"
                size={28}
                color={colors.text}
                onPress={() => router.back()}
              />
              <Text style={styles.title}>פאנל ניהול</Text>
            </View>

            <Text style={styles.sectionTitle}>
              בקשות משיכה ({requestedPayouts.length})
            </Text>
            {requestedPayouts.length === 0 ? (
              <Text style={styles.empty}>אין בקשות משיכה ממתינות.</Text>
            ) : (
              requestedPayouts.map((p) => (
                <Card key={p.id} style={styles.rowCard}>
                  <View style={styles.rowTop}>
                    <Text style={styles.amount}>{formatMoney(p.amount)}</Text>
                    <Text style={styles.date}>{formatDate(p.created_at)}</Text>
                  </View>
                  <UserInfo user={p.user} />
                  <Button
                    label="סמן כשולם"
                    onPress={() => markPaid(p.id)}
                    loading={busyId === p.id}
                  />
                </Card>
              ))
            )}

            <Text style={styles.sectionTitle}>
              עסקאות ממתינות לאישור ({pending.length})
            </Text>
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>אין עסקאות ממתינות.</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Card style={styles.rowCard}>
            <View style={styles.rowTop}>
              <Text style={styles.amount}>
                {formatMoney(item.cashback_amount)}
              </Text>
              <Text style={styles.meta}>{item.store?.name ?? "חנות"}</Text>
            </View>
            <Text style={styles.date}>
              רכישה:{" "}
              {item.order_amount != null ? formatMoney(item.order_amount) : "—"}{" "}
              · {formatDate(item.created_at)}
            </Text>
            <UserInfo user={item.user} />
            <View style={styles.actions}>
              <View style={{ flex: 1 }}>
                <Button
                  label="אישור"
                  onPress={() => setStatus(item.id, "confirmed")}
                  loading={busyId === item.id}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label="דחייה"
                  variant="secondary"
                  onPress={() => setStatus(item.id, "rejected")}
                  loading={busyId === item.id}
                />
              </View>
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

// פרטי המשתמש שמקבל את הקאשבק — כדי שהמנהל יידע למי להעביר בביט.
function UserInfo({ user }: { user?: UserBrief }) {
  if (!user) return null;
  return (
    <View style={styles.userBox}>
      {user.full_name ? (
        <Text style={styles.userName}>{user.full_name}</Text>
      ) : null}
      {user.phone ? (
        <View style={styles.userLine}>
          <Ionicons name="call-outline" size={14} color={colors.primary} />
          <Text style={styles.userText}>{user.phone}</Text>
        </View>
      ) : null}
      {user.email ? (
        <View style={styles.userLine}>
          <Ionicons name="mail-outline" size={14} color={colors.textMuted} />
          <Text style={styles.userText}>{user.email}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.xl, gap: spacing.md },
  headerRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  title: {
    fontSize: font.xxl,
    fontWeight: "800",
    color: colors.text,
    textAlign: "right",
  },
  sectionTitle: {
    fontSize: font.lg,
    fontWeight: "700",
    color: colors.text,
    textAlign: "right",
  },
  rowCard: { gap: spacing.sm },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  amount: { fontSize: font.lg, fontWeight: "800", color: colors.text },
  meta: {
    fontSize: font.md,
    color: colors.textMuted,
    textAlign: "right",
    flex: 1,
    marginRight: spacing.md,
  },
  date: { fontSize: font.sm, color: colors.textMuted, textAlign: "right" },
  userBox: {
    gap: 4,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  userName: {
    fontSize: font.md,
    fontWeight: "800",
    color: colors.text,
    textAlign: "right",
  },
  userLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    justifyContent: "flex-end",
  },
  userText: { fontSize: font.sm, color: colors.text },
  actions: { flexDirection: "row", gap: spacing.md },
  empty: {
    textAlign: "center",
    color: colors.textMuted,
    marginVertical: spacing.md,
  },
  denied: {
    textAlign: "center",
    color: colors.textMuted,
    marginTop: spacing.xxl,
  },
});
