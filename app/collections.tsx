import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { fetchStores } from "@/lib/cashback";
import { COLLECTIONS } from "@/lib/sections";
import { Store } from "@/lib/types";
import { ScreenHeader } from "@/ui";
import { colors, font, radius, rtl, shadow, spacing } from "@/theme";

export default function CollectionsScreen() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);

  const load = useCallback(async () => {
    try {
      setStores(await fetchStores());
    } catch {
      // מתעלמים.
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of COLLECTIONS) map[c.id] = stores.filter(c.match).length;
    return map;
  }, [stores]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="אוספים" subtitle="קולקציות חנויות לפי נושא" />
        <View style={styles.grid}>
          {COLLECTIONS.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => router.push(`/collection/${c.id}`)}
              style={({ pressed }) => [
                styles.card,
                shadow.sm,
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.icon, { backgroundColor: c.color + "1F" }]}>
                <Ionicons name={c.icon} size={26} color={c.color} />
              </View>
              <Text style={styles.title} numberOfLines={1}>
                {c.title}
              </Text>
              <Text style={styles.sub} numberOfLines={1}>
                {counts[c.id] ?? 0} חנויות
              </Text>
            </Pressable>
          ))}
        </View>
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
  grid: { flexDirection: rtl.row, flexWrap: "wrap", gap: spacing.md },
  card: {
    width: "47.5%",
    flexGrow: 1,
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: font.md,
    fontWeight: "800",
    color: colors.text,
    textAlign: "right",
  },
  sub: { fontSize: font.sm, color: colors.textMuted, textAlign: "right" },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
});
