import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { fetchStores } from "@/lib/cashback";
import { formatMoney } from "@/lib/format";
import { Store } from "@/lib/types";
import { Card, GradientCard, ScreenHeader, StoreLogo } from "@/ui";
import { colors, font, gradients, radius, rtl, spacing } from "@/theme";

/** הקאשבק שהמשתמש מקבל בפועל על סכום נתון (שיעור עמלה × חלק המשתמש). */
function userCashbackFor(store: Store, amount: number): number {
  const share = (store.user_share_percent ?? 0) / 100;
  if (store.cashback_type === "percent") {
    return (amount * store.cashback_value * share) / 100;
  }
  return store.cashback_value * share;
}

export default function CalculatorScreen() {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    try {
      const s = await fetchStores();
      setStores(s);
      if (s.length) setSelectedId((prev) => prev ?? s[0].id);
    } catch {
      // מתעלמים — המחשבון פשוט יישאר ריק.
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selected = useMemo(
    () => stores.find((s) => s.id === selectedId) ?? null,
    [stores, selectedId],
  );

  const visibleStores = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stores.slice(0, 24);
    return stores.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 40);
  }, [stores, query]);

  const amountNum = Number(amount.replace(/[^0-9.]/g, "")) || 0;
  const result = selected ? userCashbackFor(selected, amountNum) : 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader title="מחשבון קאשבק" />

        <Card style={{ gap: spacing.md }}>
          <Text style={styles.sectionTitle}>סכום הרכישה</Text>
          <View style={styles.amountBox}>
            <Text style={styles.currency}>₪</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              keyboardType="numeric"
              placeholderTextColor={colors.textMuted}
              style={styles.amountInput}
            />
          </View>

          <Text style={styles.sectionTitle}>בחירת חנות</Text>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="חיפוש חנות"
              placeholderTextColor={colors.textMuted}
              style={styles.searchInput}
            />
            {query ? (
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.textMuted}
                onPress={() => setQuery("")}
              />
            ) : null}
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storeRow}
            keyboardShouldPersistTaps="handled"
          >
            {visibleStores.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => setSelectedId(s.id)}
                style={[
                  styles.storeChip,
                  selectedId === s.id && styles.storeChipActive,
                ]}
              >
                <StoreLogo store={s} size={40} />
                <Text style={styles.storeChipName} numberOfLines={1}>
                  {s.name}
                </Text>
              </Pressable>
            ))}
            {visibleStores.length === 0 ? (
              <Text style={styles.noResults}>לא נמצאו חנויות</Text>
            ) : null}
          </ScrollView>
        </Card>

        <GradientCard colors={gradients.money as unknown as string[]} glow>
          <Text style={styles.resultLabel}>הקאשבק המשוער שלך</Text>
          <Text style={styles.resultValue}>{formatMoney(result)}</Text>
          {selected ? (
            <Text style={styles.resultSub}>
              על רכישה של {formatMoney(amountNum)} ב{selected.name}
            </Text>
          ) : null}
        </GradientCard>

        <Text style={styles.disclaimer}>
          * החישוב הוא הערכה בלבד. הקאשבק בפועל נקבע לפי אישור החנות ועשוי
          להשתנות לפי קטגוריית המוצר.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  sectionTitle: {
    fontSize: font.lg,
    fontWeight: "800",
    color: colors.text,
    textAlign: "right",
  },
  amountBox: {
    flexDirection: rtl.row,
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    height: 60,
    borderWidth: 1,
    borderColor: colors.border,
  },
  currency: { fontSize: font.xl, fontWeight: "900", color: colors.textMuted },
  amountInput: {
    flex: 1,
    height: "100%",
    fontSize: font.xxl,
    fontWeight: "900",
    color: colors.text,
    textAlign: "right",
  },
  storeRow: {
    flexDirection: rtl.row,
    gap: spacing.sm,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  searchBar: {
    flexDirection: rtl.row,
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: font.md,
    color: colors.text,
    textAlign: "right",
  },
  noResults: {
    fontSize: font.sm,
    color: colors.textMuted,
    paddingVertical: spacing.md,
  },
  storeChip: {
    width: 84,
    alignItems: "center",
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: colors.bg,
  },
  storeChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  storeChipName: {
    fontSize: font.sm,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  resultLabel: {
    fontSize: font.md,
    fontWeight: "700",
    color: "#EAFBF3",
    textAlign: "center",
  },
  resultValue: {
    fontSize: font.xxxl,
    fontWeight: "900",
    color: colors.textInverse,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  resultSub: {
    fontSize: font.sm,
    color: "#EAFBF3",
    textAlign: "center",
    marginTop: spacing.xs,
  },
  disclaimer: {
    fontSize: font.sm,
    color: colors.textMuted,
    textAlign: "right",
    lineHeight: 20,
  },
});
