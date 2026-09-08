import { useCallback, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { fetchStores } from "@/lib/cashback";
import { formatCashbackLabel } from "@/lib/format";
import { Store } from "@/lib/types";
import { GradientCard } from "@/ui";
import { colors, font, gradients, radius, shadow, spacing } from "@/theme";

export default function StoresScreen() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FlatList
        data={stores}
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
            <View>
              <Text style={styles.hello}>שלום 👋</Text>
              <Text style={styles.title}>חנויות עם קאשבק</Text>
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
            <Text style={styles.sectionTitle}>כל החנויות</Text>
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>
              {error ?? "אין חנויות זמינות עדיין."}
            </Text>
          ) : null
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
            <View style={styles.logo}>
              {item.logo_url ? (
                <Image source={{ uri: item.logo_url }} style={styles.logoImg} />
              ) : (
                <Text style={styles.logoText}>{item.name.charAt(0)}</Text>
              )}
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.storeName}>{item.name}</Text>
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
              <Ionicons
                name="chevron-back"
                size={18}
                color={colors.textMuted}
              />
            </View>
          </Pressable>
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
    paddingBottom: 110,
    gap: spacing.md,
  },
  hello: {
    fontSize: font.md,
    color: colors.textMuted,
    textAlign: "right",
    fontWeight: "600",
  },
  title: {
    fontSize: font.xxxl,
    fontWeight: "900",
    color: colors.text,
    textAlign: "right",
  },
  heroRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.985 }] },
  chevWrap: { paddingHorizontal: spacing.xs },
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
  logo: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoImg: { width: "100%", height: "100%" },
  logoText: { fontSize: font.xl, fontWeight: "900", color: colors.primary },
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
