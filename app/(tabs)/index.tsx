import { useCallback, useMemo, useState } from "react";
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
import { fetchStores } from "@/lib/cashback";
import { formatCashbackLabel } from "@/lib/format";
import { Store } from "@/lib/types";
import { GradientCard, StoreLogo } from "@/ui";
import { colors, font, gradients, radius, rtl, shadow, spacing } from "@/theme";

export default function StoresScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const firstName = user?.full_name?.trim().split(/\s+/)[0] ?? "";
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setStores(await fetchStores());
    } catch (e) {
      setError("לא הצלחנו לטעון חנויות. בדקו חיבור ו-Supabase.");
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
    stores.forEach((s) => s.category && set.add(s.category));
    return Array.from(set);
  }, [stores]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stores.filter((s) => {
      const matchesCat = !category || s.category === category;
      const matchesQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.category?.toLowerCase().includes(q) ?? false);
      return matchesCat && matchesQuery;
    });
  }, [stores, query, category]);

  // חנויות מומלצות: הקאשבק הגבוה ביותר.
  const featured = useMemo(
    () =>
      [...stores]
        .sort((a, b) => b.cashback_value - a.cashback_value)
        .slice(0, 8),
    [stores],
  );

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

            {featured.length > 0 && !query && !category ? (
              <View style={{ gap: spacing.sm }}>
                <Text style={styles.sectionTitle}>מומלצות 🔥</Text>
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
                          {formatCashbackLabel(s.cashback_type, s.cashback_value)}
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

            <Text style={styles.sectionTitle}>
              {category ?? "כל החנויות"} ({filtered.length})
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
                {formatCashbackLabel(item.cashback_type, item.cashback_value)}
              </Text>
            </View>
            <View style={styles.chevWrap}>
              <Ionicons name="chevron-back" size={22} color={colors.primary} />
            </View>
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
