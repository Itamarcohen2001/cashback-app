import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { fetchFeaturedCoupons, fetchStores } from "@/lib/cashback";
import { categoryMeta } from "@/lib/categories";
import {
  getFavoriteIds,
  subscribeFavorites,
  toggleFavorite,
} from "@/lib/favorites";
import { formatUserCashback } from "@/lib/format";
import { getRecentStoreIds } from "@/lib/recent";
import { Coupon, Store } from "@/lib/types";
import { CouponCard, GradientCard, HeartButton, StoreLogo } from "@/ui";
import { colors, font, gradients, radius, rtl, shadow, spacing } from "@/theme";

type SortMode = "popular" | "cashback" | "name";

/** קאשבק אפקטיבי (לצורך מיון): שיעור/סכום × חלק המשתמש. */
function effectiveCashback(s: Store): number {
  return (s.cashback_value * s.user_share_percent) / 100;
}

export default function StoresScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const firstName = user?.full_name?.trim().split(/\s+/)[0] ?? "";
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sort, setSort] = useState<SortMode>("popular");
  const [hotDeals, setHotDeals] = useState<Coupon[]>([]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [s, deals] = await Promise.all([
        fetchStores(),
        fetchFeaturedCoupons().catch(() => [] as Coupon[]),
      ]);
      setStores(s);
      setHotDeals(deals);
    } catch (e) {
      setError("לא הצלחנו לטעון חנויות. בדקו חיבור ו-Supabase.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      getRecentStoreIds().then(setRecentIds);
      getFavoriteIds().then(setFavoriteIds);
    }, [load]),
  );

  useEffect(() => subscribeFavorites(setFavoriteIds), []);

  const onToggleFavorite = useCallback((id: string) => {
    toggleFavorite(id);
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    stores.forEach((s) => s.category && set.add(s.category));
    return Array.from(set);
  }, [stores]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const favSet = new Set(favoriteIds);
    const list = stores.filter((s) => {
      const matchesCat = !category || s.category === category;
      const matchesFav = !onlyFavorites || favSet.has(s.id);
      const matchesQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.category?.toLowerCase().includes(q) ?? false);
      return matchesCat && matchesFav && matchesQuery;
    });
    const sorted = [...list];
    if (sort === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name, "he"));
    } else if (sort === "cashback") {
      sorted.sort((a, b) => effectiveCashback(b) - effectiveCashback(a));
    } else {
      sorted.sort(
        (a, b) =>
          Number(Boolean(b.popular)) - Number(Boolean(a.popular)) ||
          effectiveCashback(b) - effectiveCashback(a),
      );
    }
    return sorted;
  }, [stores, query, category, onlyFavorites, favoriteIds, sort]);

  // המומלצות שלך: חנויות שנצפו/נעשה בהן שימוש לאחרונה.
  const featured = useMemo(() => {
    const byId = new Map(stores.map((s) => [s.id, s]));
    return recentIds
      .map((id) => byId.get(id))
      .filter((s): s is Store => Boolean(s));
  }, [stores, recentIds]);

  const noFilter = !query && !category && !onlyFavorites;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FlatList
        data={filtered}
        keyExtractor={(s) => s.id}
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
            <View style={styles.greetRow}>
              <View style={styles.greetAvatar}>
                <Text style={styles.greetAvatarText}>
                  {(firstName || "👋").charAt(0)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.hello}>
                  {`שלום${firstName ? ` ${firstName}` : ""}`} 👋
                </Text>
                <Text style={styles.title}>חנויות עם קאשבק</Text>
              </View>
            </View>
            <GradientCard
              colors={gradients.primary as unknown as string[]}
              glow
            >
              <View style={styles.heroRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroTitle}>
                    קונים כרגיל,{"\n"}מקבלים כסף בחזרה 💸
                  </Text>
                  <Text style={styles.heroSub}>הפעילו קאשבק לפני כל רכישה</Text>
                </View>
                <View style={styles.heroIcon}>
                  <Ionicons
                    name="cash-outline"
                    size={30}
                    color={colors.textInverse}
                  />
                </View>
              </View>
            </GradientCard>

            {categories.length > 0 ? (
              <View style={{ gap: spacing.sm }}>
                <Text style={styles.sectionTitle}>קטגוריות</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.catRow}
                >
                  <CategoryTile
                    label="הכול"
                    icon="grid"
                    color={colors.primary}
                    active={!category}
                    onPress={() => setCategory(null)}
                  />
                  {categories.map((c) => {
                    const meta = categoryMeta(c);
                    return (
                      <CategoryTile
                        key={c}
                        label={c}
                        icon={meta.icon}
                        color={meta.color}
                        active={category === c}
                        onPress={() =>
                          setCategory((prev) => (prev === c ? null : c))
                        }
                      />
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            {hotDeals.length > 0 && noFilter ? (
              <View style={{ gap: spacing.sm }}>
                <Text style={styles.sectionTitle}>דילים חמים 🔥</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.dealsRow}
                >
                  {hotDeals.map((c) => (
                    <View key={c.id} style={styles.dealCardWrap}>
                      <CouponCard
                        coupon={c}
                        onPress={() => router.push(`/store/${c.store_id}`)}
                      />
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {featured.length > 0 && noFilter ? (
              <View style={{ gap: spacing.sm }}>
                <Text style={styles.sectionTitle}>נצפו לאחרונה 👀</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.featuredRow}
                >
                  {featured.map((s) => (
                    <Pressable
                      key={s.id}
                      style={[styles.featuredCard, shadow.sm]}
                      onPress={() => router.push(`/store/${s.id}`)}
                    >
                      <StoreLogo store={s} size={48} />
                      <Text style={styles.featuredName} numberOfLines={1}>
                        {s.name}
                      </Text>
                      <View style={styles.cashPill}>
                        <Text style={styles.cashPillText}>
                          {formatUserCashback(s)}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color={colors.textMuted} />
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
              contentContainerStyle={styles.chipsRow}
            >
              <Chip
                label="❤ מועדפים"
                active={onlyFavorites}
                onPress={() => setOnlyFavorites((v) => !v)}
              />
              <Chip
                label="פופולריות"
                active={sort === "popular"}
                onPress={() => setSort("popular")}
              />
              <Chip
                label="קאשבק גבוה"
                active={sort === "cashback"}
                onPress={() => setSort("cashback")}
              />
              <Chip
                label="א-ב"
                active={sort === "name"}
                onPress={() => setSort("name")}
              />
            </ScrollView>

            <Text style={styles.sectionTitle}>
              {onlyFavorites ? "המועדפים שלי" : (category ?? "כל החנויות")} (
              {filtered.length})
            </Text>
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
              {error ??
                (stores.length
                  ? "לא נמצאו חנויות התואמות לחיפוש."
                  : "אין חנויות זמינות עדיין.")}
            </Text>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.row,
              shadow.sm,
              pressed && styles.pressed,
            ]}
            onPress={() => router.push(`/store/${item.id}`)}
          >
            <StoreLogo store={item} size={56} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.storeName} numberOfLines={1}>
                {item.name}
              </Text>
              {item.category ? (
                <Text style={styles.category}>{item.category}</Text>
              ) : null}
            </View>
            <View style={styles.cashPill}>
              <Text style={styles.cashPillText}>
                {formatUserCashback(item)}
              </Text>
            </View>
            <HeartButton
              active={favoriteIds.includes(item.id)}
              onPress={() => onToggleFavorite(item.id)}
              size={20}
            />
          </Pressable>
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

function CategoryTile({
  label,
  icon,
  color,
  active,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.catTile} onPress={onPress}>
      <View
        style={[
          styles.catIcon,
          { backgroundColor: active ? color : color + "1F" },
        ]}
      >
        <Ionicons name={icon} size={24} color={active ? "#fff" : color} />
      </View>
      <Text
        style={[styles.catLabel, active && { color: colors.text }]}
        numberOfLines={1}
      >
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
  greetRow: { flexDirection: rtl.row, alignItems: "center", gap: spacing.md },
  greetAvatar: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  greetAvatarText: {
    fontSize: font.xl,
    fontWeight: "900",
    color: colors.primary,
  },
  hello: {
    fontSize: font.lg,
    color: colors.textMuted,
    textAlign: "right",
    fontWeight: "700",
  },
  title: {
    fontSize: font.xxxl,
    fontWeight: "900",
    color: colors.text,
    textAlign: "right",
  },
  heroRow: { flexDirection: rtl.row, alignItems: "center", gap: spacing.md },
  heroTitle: {
    fontSize: font.xl,
    fontWeight: "900",
    color: colors.textInverse,
    textAlign: "right",
    lineHeight: 30,
  },
  heroSub: {
    fontSize: font.sm,
    color: "#EDEBFF",
    textAlign: "right",
    marginTop: spacing.xs,
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: font.lg,
    fontWeight: "800",
    color: colors.text,
    textAlign: "right",
  },
  featuredRow: { gap: spacing.md, paddingVertical: 2, paddingHorizontal: 2 },
  catRow: { gap: spacing.md, paddingVertical: 2, paddingHorizontal: 2 },
  catTile: { width: 72, alignItems: "center", gap: spacing.xs },
  catIcon: {
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  catLabel: {
    fontSize: font.sm,
    fontWeight: "700",
    color: colors.textMuted,
    textAlign: "center",
  },
  dealsRow: { gap: spacing.md, paddingVertical: 2, paddingHorizontal: 2 },
  dealCardWrap: { width: 300 },
  featuredCard: {
    width: 120,
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  featuredName: {
    fontSize: font.sm,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
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
  chipsRow: { gap: spacing.md, paddingVertical: 2, paddingHorizontal: 2 },
  chip: {
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: font.sm, fontWeight: "700", color: colors.textMuted },
  chipTextActive: { color: colors.textInverse },
  row: {
    flexDirection: rtl.row,
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.985 }] },
  chevWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  cashPill: {
    backgroundColor: colors.accentLight,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
  },
  cashPillText: {
    color: colors.accentDark,
    fontWeight: "900",
    fontSize: font.sm,
  },
  logoImg: { width: "100%", height: "100%" },
  storeName: {
    fontSize: font.lg,
    fontWeight: "800",
    color: colors.text,
    textAlign: "right",
  },
  category: { fontSize: font.sm, color: colors.textMuted, textAlign: "right" },
  empty: {
    textAlign: "center",
    color: colors.textMuted,
    marginTop: spacing.xxl,
  },
});
