import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { fetchCoupons } from "@/lib/cashback";
import { Coupon } from "@/lib/types";
import { CouponCard } from "@/ui";
import { colors, font, radius, shadow, spacing } from "@/theme";

export default function DealsScreen() {
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setCoupons(await fetchCoupons());
    } catch (e) {
      setError("לא הצלחנו לטעון דילים. בדקו חיבור ו-Supabase.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const categories = useMemo(() => {
    const set = new Set<string>();
    coupons.forEach((c) => c.store?.category && set.add(c.store.category));
    return Array.from(set);
  }, [coupons]);

  const filtered = useMemo(
    () =>
      category
        ? coupons.filter((c) => c.store?.category === category)
        : coupons,
    [coupons, category],
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={{ gap: spacing.lg, marginBottom: spacing.lg }}>
            <View>
              <Text style={styles.title}>דילים וקופונים 🔥</Text>
              <Text style={styles.subtitle}>
                קודי הנחה ומבצעים חמים — בנוסף לקאשבק
              </Text>
            </View>

            {categories.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
              >
                <Chip
                  label="הכול"
                  active={!category}
                  onPress={() => setCategory(null)}
                />
                {categories.map((c) => (
                  <Chip
                    key={c}
                    label={c}
                    active={category === c}
                    onPress={() => setCategory(c)}
                  />
                ))}
              </ScrollView>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator
              color={colors.primary}
              style={{ marginTop: spacing.xxl }}
            />
          ) : (
            <Text style={styles.empty}>
              {error ?? "אין דילים זמינים כרגע."}
            </Text>
          )
        }
        renderItem={({ item }) => (
          <CouponCard
            coupon={item}
            onPress={() => router.push(`/store/${item.store_id}`)}
          />
        )}
      />
    </SafeAreaView>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 130,
    gap: spacing.md,
  },
  title: {
    fontSize: font.xxxl,
    fontWeight: "900",
    color: colors.text,
    textAlign: "right",
  },
  subtitle: {
    fontSize: font.md,
    color: colors.textMuted,
    textAlign: "right",
    marginTop: spacing.xs,
  },
  chipsRow: { gap: spacing.md, paddingVertical: 2, paddingHorizontal: 2 },
  chip: {
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: font.sm, fontWeight: "700", color: colors.textMuted },
  chipTextActive: { color: colors.textInverse },
  empty: {
    textAlign: "center",
    color: colors.textMuted,
    marginTop: spacing.xxl,
  },
});
