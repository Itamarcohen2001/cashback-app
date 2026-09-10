import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchStores } from "@/lib/cashback";
import {
  getFavoriteIds,
  subscribeFavorites,
  toggleFavorite,
} from "@/lib/favorites";
import { collectionById } from "@/lib/sections";
import { Store } from "@/lib/types";
import { ScreenHeader, StoreGridSkeleton, StoreTile, EmptyState } from "@/ui";
import { colors, font, spacing } from "@/theme";

export default function CollectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const collection = collectionById(String(id));
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
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

  const filtered = useMemo(
    () => (collection ? stores.filter(collection.match) : []),
    [stores, collection],
  );

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
          <View style={{ marginBottom: spacing.lg }}>
            <ScreenHeader
              title={collection?.title ?? "קולקציה"}
              subtitle={
                collection
                  ? `${filtered.length} חנויות · ${collection.subtitle}`
                  : undefined
              }
            />
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <StoreGridSkeleton />
          ) : (
            <EmptyState
              icon="albums-outline"
              title="אין חנויות בקולקציה הזו"
              subtitle="נסו קולקציה אחרת."
            />
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
  empty: {
    textAlign: "center",
    color: colors.textMuted,
    marginTop: spacing.xxl,
    fontSize: font.md,
  },
});
