import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import {
  fetchPayouts,
  fetchTransactions,
  requestPayout,
  summarizeWallet,
} from "@/lib/cashback";
import { formatDate, formatMoney } from "@/lib/format";
import {
  CashbackStatus,
  CashbackTransaction,
  PayoutRequest,
  WalletSummary,
} from "@/lib/types";
import { Badge, Button, GradientCard } from "@/ui";
import { colors, font, gradients, radius, shadow, spacing } from "@/theme";

const MIN_PAYOUT = 20;

const STATUS_META: Record<CashbackStatus, { label: string; color: string }> = {
  pending: { label: "ממתין לאישור", color: colors.pending },
  confirmed: { label: "אושר", color: colors.confirmed },
  paid: { label: "שולם", color: colors.paid },
  rejected: { label: "נדחה", color: colors.rejected },
};

const PAYOUT_META: Record<
  PayoutRequest["status"],
  { label: string; color: string }
> = {
  requested: { label: "בבקשה", color: colors.pending },
  paid: { label: "שולם", color: colors.paid },
  rejected: { label: "נדחה", color: colors.rejected },
};

export default function WalletScreen() {
  const { user } = useAuth();
  const [txns, setTxns] = useState<CashbackTransaction[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [summary, setSummary] = useState<WalletSummary>({
    pending: 0,
    confirmed: 0,
    paid: 0,
    available: 0,
  });
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      const [data, payoutData] = await Promise.all([
        fetchTransactions(user.id),
        fetchPayouts(user.id),
      ]);
      setTxns(data);
      setPayouts(payoutData);
      setSummary(summarizeWallet(data));
    } catch (e) {
      setError("לא הצלחנו לטעון את הארנק.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function onRequestPayout() {
    if (!user) return;
    if (summary.available < MIN_PAYOUT) {
      Alert.alert(
        "סכום נמוך מדי",
        `ניתן למשוך החל מ-${formatMoney(MIN_PAYOUT)}. הזמין כרגע: ${formatMoney(summary.available)}.`,
      );
      return;
    }
    setRequesting(true);
    try {
      await requestPayout(user.id, summary.available);
      Alert.alert("הבקשה נשלחה", "בקשת המשיכה התקבלה ותטופל בקרוב.");
      await load();
    } catch (e) {
      Alert.alert("שגיאה", "לא הצלחנו לשלוח בקשת משיכה.");
    } finally {
      setRequesting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FlatList
        data={txns}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} />
        }
        ListHeaderComponent={
          <View style={{ gap: spacing.lg }}>
            <Text style={styles.title}>הארנק שלי</Text>
            <GradientCard colors={gradients.wallet as unknown as string[]} glow>
              <Text style={styles.balanceLabel}>זמין למשיכה</Text>
              <Text style={styles.balanceValue}>
                {formatMoney(summary.available)}
              </Text>
              <View style={styles.statsRow}>
                <Stat
                  label="ממתין"
                  value={summary.pending}
                  icon="time-outline"
                />
                <View style={styles.statDivider} />
                <Stat
                  label="שולם"
                  value={summary.paid}
                  icon="checkmark-done-outline"
                />
              </View>
              <View style={styles.progressWrap}>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(summary.available / MIN_PAYOUT, 1) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {summary.available >= MIN_PAYOUT
                    ? "הגעת לסכום המינימלי — אפשר למשוך! 🎉"
                    : `עוד ${formatMoney(MIN_PAYOUT - summary.available)} עד למשיכה`}
                </Text>
              </View>
            </GradientCard>
            <Button
              label="בקשת משיכה"
              onPress={onRequestPayout}
              loading={requesting}
              disabled={summary.available < MIN_PAYOUT}
              icon={
                <Ionicons
                  name="arrow-down-circle-outline"
                  size={20}
                  color={colors.textInverse}
                />
              }
            />
            <Text style={styles.minHint}>
              סכום מינימלי למשיכה: {formatMoney(MIN_PAYOUT)}
            </Text>

            {payouts.length > 0 ? (
              <View style={{ gap: spacing.sm }}>
                <Text style={styles.sectionTitle}>בקשות משיכה</Text>
                {payouts.map((p) => {
                  const meta = PAYOUT_META[p.status];
                  return (
                    <View key={p.id} style={[styles.txnRow, shadow.sm]}>
                      <View
                        style={[
                          styles.txnIcon,
                          { backgroundColor: meta.color + "1F" },
                        ]}
                      >
                        <Ionicons
                          name="cash-outline"
                          size={18}
                          color={meta.color}
                        />
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={styles.txnStore}>בקשת משיכה</Text>
                        <Text style={styles.txnDate}>
                          {formatDate(p.created_at)}
                        </Text>
                      </View>
                      <View style={styles.amountCol}>
                        <Text style={styles.txnAmount}>
                          {formatMoney(p.amount)}
                        </Text>
                        <Badge text={meta.label} color={meta.color} />
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : null}

            <Text style={styles.sectionTitle}>היסטוריית קאשבק</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator
              color={colors.primary}
              style={{ marginTop: spacing.xl }}
            />
          ) : (
            <Text style={styles.empty}>
              עדיין אין עסקאות. הפעילו קאשבק בחנות כדי להתחיל.
            </Text>
          )
        }
        renderItem={({ item }) => {
          const meta = STATUS_META[item.status];
          return (
            <View style={[styles.txnRow, shadow.sm]}>
              <View
                style={[styles.txnIcon, { backgroundColor: meta.color + "1F" }]}
              >
                <Ionicons name="pricetag" size={18} color={meta.color} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.txnStore}>
                  {item.store?.name ?? "חנות"}
                </Text>
                <Text style={styles.txnDate}>
                  {formatDate(item.created_at)}
                </Text>
              </View>
              <View style={styles.amountCol}>
                <Text style={styles.txnAmount}>
                  {formatMoney(item.cashback_amount)}
                </Text>
                <Badge text={meta.label} color={meta.color} />
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={16} color="#EDEBFF" />
      <Text style={styles.statValue}>{formatMoney(value)}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.lg, paddingBottom: 130, gap: spacing.md },
  title: {
    fontSize: font.xxxl,
    fontWeight: "900",
    color: colors.text,
    textAlign: "right",
  },
  balanceLabel: {
    color: "#EDEBFF",
    fontSize: font.md,
    fontWeight: "600",
    textAlign: "center",
  },
  balanceValue: {
    color: colors.textInverse,
    fontSize: 44,
    fontWeight: "900",
    textAlign: "center",
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xl,
    marginTop: spacing.lg,
  },
  statDivider: {
    width: 1,
    height: 34,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  progressWrap: { marginTop: spacing.lg, gap: spacing.xs, width: "100%" },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: colors.textInverse,
  },
  progressText: {
    color: "#EDEBFF",
    fontSize: font.sm,
    textAlign: "center",
    fontWeight: "600",
  },
  stat: { alignItems: "center", gap: 2 },
  statValue: {
    fontSize: font.lg,
    fontWeight: "800",
    color: colors.textInverse,
  },
  statLabel: { fontSize: font.sm, color: "#EDEBFF" },
  sectionTitle: {
    fontSize: font.lg,
    fontWeight: "800",
    color: colors.text,
    textAlign: "right",
  },
  error: { color: colors.danger, textAlign: "right" },
  empty: {
    textAlign: "center",
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
  minHint: {
    fontSize: font.sm,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: -spacing.sm,
  },
  amountCol: { alignItems: "flex-end", gap: spacing.xs },
  txnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  txnIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  txnStore: {
    fontSize: font.md,
    fontWeight: "800",
    color: colors.text,
    textAlign: "right",
  },
  txnDate: { fontSize: font.sm, color: colors.textMuted, textAlign: "right" },
  txnAmount: { fontSize: font.lg, fontWeight: "900", color: colors.text },
});
