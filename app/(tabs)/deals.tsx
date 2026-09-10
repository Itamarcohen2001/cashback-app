import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { fetchCoupons } from "@/lib/cashback";
import { Coupon } from "@/lib/types";
import { CouponCard, EmptyState, Skeleton } from "@/ui";
import { colors, font, radius, rtl, shadow, spacing } from "@/theme";

export default function DealsScreen() {
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return coupons.filter((c) => {
      const matchesCat = !category || c.store?.category === category;
      const matchesQuery =
        !q ||
        c.title.toLowerCase().includes(q) ||
        (c.store?.name?.toLowerCase().includes(q) ?? false) ||
        (c.code?.toLowerCase().includes(q) ?? false);
      return matchesCat && matchesQuery;
    });
  }, [coupons, category, query]);

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

            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color={colors.textMuted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="חיפוש דיל, חנות או קוד"
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

            {categories.length > 0 ? (
              <View style={styles.chipsRow}>
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
              </View>
            ) : null}

            {!loading && filtered.length > 0 ? (
              <Text style={styles.count}>{filtered.length} דילים פעילים</Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={{ gap: spacing.md }}>
              <Skeleton height={120} radius={radius.lg} />
              <Skeleton height={120} radius={radius.lg} />
              <Skeleton height={120} radius={radius.lg} />
            </View>
          ) : (
            <EmptyState
              icon="pricetags-outline"
              title={error ? "בעיה בטעינת הדילים" : "אין דילים כרגע"}
              subtitle={error ?? "חזרו בקרוב — אנחנו מעדכנים דילים כל הזמן."}
            />
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
  searchBar: {
    flexDirection: rtl.row,
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    height: 50,
    ...shadow.sm,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: font.md,
    color: colors.text,
    textAlign: "right",
  },
  chipsRow: {
    flexDirection: rtl.row,
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  count: {
    fontSize: font.sm,
    fontWeight: "700",
    color: colors.textMuted,
    textAlign: "right",
  },
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
