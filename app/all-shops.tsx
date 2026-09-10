import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import { isIsraeliStore } from "@/lib/sections";
import { Store } from "@/lib/types";
import { ScreenHeader, StoreTile } from "@/ui";
import { colors, font, radius, rtl, shadow, spacing } from "@/theme";

export default function AllShopsScreen() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [israeliOnly, setIsraeliOnly] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    try {
      setStores(await fetchStores());
    } catch {
      // מתעלמים.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    getFavoriteIds().then(setFavoriteIds);
    return subscribeFavorites(setFavoriteIds);
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stores
      .filter((s) => {
        const matchQuery = !q || s.name.toLowerCase().includes(q);
        const matchIsraeli = !israeliOnly || isIsraeliStore(s);
        return matchQuery && matchIsraeli;
      })
      .sort((a, b) => a.name.localeCompare(b.name, "he"));
  }, [stores, query, israeliOnly]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FlatList
        data={filtered}
        keyExtractor={(s) => s.id}
        numColumns={3}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ gap: spacing.md, marginBottom: spacing.lg }}>
            <ScreenHeader
              title="כל החנויות"
              subtitle={`${stores.length} חנויות עם קאשבק`}
            />
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
            <Pressable
              onPress={() => setIsraeliOnly((v) => !v)}
              style={[styles.chip, israeliOnly && styles.chipActive]}
            >
              <Text style={styles.chipFlag}>🇮🇱</Text>
              <Text
                style={[styles.chipText, israeliOnly && styles.chipTextActive]}
              >
                חנויות ישראליות בלבד
              </Text>
            </Pressable>
            <Text style={styles.count}>{filtered.length} תוצאות</Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator
              color={colors.primary}
              style={{ marginTop: spacing.xxl }}
            />
          ) : (
            <Text style={styles.empty}>לא נמצאו חנויות.</Text>
          )
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
  chip: {
    flexDirection: rtl.row,
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: rtl.start,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  chipFlag: { fontSize: font.md },
  chipText: { fontSize: font.sm, fontWeight: "700", color: colors.textMuted },
  chipTextActive: { color: colors.primaryDark },
  count: {
    fontSize: font.sm,
    fontWeight: "700",
    color: colors.textMuted,
    textAlign: "right",
  },
  empty: {
    textAlign: "center",
    color: colors.textMuted,
    marginTop: spacing.xxl,
  },
});
