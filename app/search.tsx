import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { fetchStores } from "@/lib/cashback";
import {
  getFavoriteIds,
  subscribeFavorites,
  toggleFavorite,
} from "@/lib/favorites";
import { Store } from "@/lib/types";
import { ScreenHeader, StoreTile } from "@/ui";
import { colors, font, radius, rtl, shadow, spacing } from "@/theme";

const POPULAR = [
  "AliExpress",
  "Shein",
  "Temu",
  "KSP",
  "iHerb",
  "Booking",
  "ZARA",
  "Nike",
];

export default function SearchScreen() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [query, setQuery] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    try {
      setStores(await fetchStores());
    } catch {
      // מתעלמים.
    }
  }, []);

  useEffect(() => {
    load();
    getFavoriteIds().then(setFavoriteIds);
    return subscribeFavorites(setFavoriteIds);
  }, [load]);

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!q) return [];
    return stores.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.category?.toLowerCase().includes(q) ?? false),
    );
  }, [stores, q]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FlatList
        data={results}
        keyExtractor={(s) => s.id}
        numColumns={3}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ gap: spacing.lg, marginBottom: spacing.lg }}>
            <ScreenHeader title="חיפוש" />
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color={colors.textMuted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="חיפוש חנות או קטגוריה"
                placeholderTextColor={colors.textMuted}
                style={styles.searchInput}
                autoFocus
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

            {!q ? (
              <View style={{ gap: spacing.sm }}>
                <Text style={styles.sectionTitle}>חיפושים פופולריים</Text>
                <View style={styles.tagsRow}>
                  {POPULAR.map((t) => (
                    <Pressable
                      key={t}
                      onPress={() => setQuery(t)}
                      style={styles.tag}
                    >
                      <Ionicons
                        name="trending-up"
                        size={14}
                        color={colors.primary}
                      />
                      <Text style={styles.tagText}>{t}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : (
              <Text style={styles.sectionTitle}>{results.length} תוצאות</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          q ? (
            <Text style={styles.empty}>לא נמצאו חנויות עבור "{query}".</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <StoreTile
            store={item}
            onPress={() => router.push(`/store/${item.id}`)}
            favorite={favoriteIds.includes(item.id)}
            onToggleFavorite={() => toggleFavorite(item.id)}
          />
        )}
      />
    </SafeAreaView>
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
  gridRow: { gap: spacing.md },
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
  sectionTitle: {
    fontSize: font.lg,
    fontWeight: "800",
    color: colors.text,
    textAlign: "right",
  },
  tagsRow: { flexDirection: rtl.row, flexWrap: "wrap", gap: spacing.sm },
  tag: {
    flexDirection: rtl.row,
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: { fontSize: font.sm, fontWeight: "700", color: colors.text },
  empty: {
    textAlign: "center",
    color: colors.textMuted,
    marginTop: spacing.xxl,
  },
});
