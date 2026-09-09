import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { USE_MOCK } from "@/lib/auth";
import {
  activateCashback,
  computeUserCashback,
  fetchStore,
  simulatePurchase,
} from "@/lib/cashback";
import { formatCashbackLabel, formatMoney } from "@/lib/format";
import { Store } from "@/lib/types";
import { Button, Card, GradientCard, Input, StoreLogo } from "@/ui";
import {
  colors,
  font,
  gradients,
  radius,
  rtl,
  shadow,
  spacing,
} from "@/theme";

export default function StoreScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [orderAmount, setOrderAmount] = useState("250");
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    (async () => {
      setStore(await fetchStore(id));
      setLoading(false);
    })();
  }, [id]);

  async function onActivate() {
    if (!store || !user) return;
    setActivating(true);
    try {
      await activateCashback(store, user.id);
    } catch (e) {
      Alert.alert("שגיאה", "לא הצלחנו להפעיל קאשבק. נסו שוב.");
    } finally {
      setActivating(false);
    }
  }

  async function onSimulate() {
    if (!store || !user) return;
    const amount = Number(orderAmount);
    if (!amount || amount <= 0) {
      Alert.alert("סכום לא תקין", "הזינו סכום רכישה חוקי.");
      return;
    }
    setSimulating(true);
    try {
      const txn = await simulatePurchase(store, user.id, amount);
      Alert.alert(
        "רכישה נקלטה 🎉",
        `נוסף קאשבק בסך ${formatMoney(txn.cashback_amount)} בסטטוס "ממתין לאישור". עברו לארנק כדי לראות אותו.`,
      );
    } catch (e: any) {
      Alert.alert("שגיאה", e?.message ?? "הסימולציה נכשלה.");
    } finally {
      setSimulating(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.loading}>טוען…</Text>
      </SafeAreaView>
    );
  }

  if (!store) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.loading}>החנות לא נמצאה.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-forward" size={22} color={colors.text} />
        </Pressable>

        <GradientCard
          colors={gradients.primary as unknown as string[]}
          glow
          style={styles.hero}
        >
          <StoreLogo
            store={store}
            size={88}
            cornerRadius={radius.lg}
            background="rgba(255,255,255,0.95)"
            letterColor={colors.primary}
          />
          <Text style={styles.name}>{store.name}</Text>
          {store.category ? (
            <Text style={styles.category}>{store.category}</Text>
          ) : null}
          <View style={styles.cashbackPill}>
            <Text style={styles.cashbackPillText}>
              {formatCashbackLabel(store.cashback_type, store.cashback_value)}
            </Text>
          </View>
          <Text style={styles.cashbackHint}>
            מתוך זה חוזר אליכם עד {store.user_share_percent}%
          </Text>
        </GradientCard>

        {store.description ? (
          <Card>
            <Text style={styles.description}>{store.description}</Text>
          </Card>
        ) : null}

        <Card style={{ gap: spacing.sm }}>
          <Text style={styles.stepsTitle}>שימו לב לפני שקונים:</Text>
          <Text style={styles.stepsText}>
            • השלימו את הרכישה באותו הביקור ללא מעבר לאתרים אחרים.{"\n"}• כבו
            חוסמי פרסומות שעלולים לחסום את המעקב.{"\n"}• הקאשבק יופיע כ"ממתין"
            ויאושר לאחר שהחנות מאשרת את ההזמנה.
          </Text>
        </Card>

        <Button
          label="הפעלת קאשבק ומעבר לחנות"
          onPress={onActivate}
          loading={activating}
        />

        {USE_MOCK ? (
          <Card style={styles.demoCard}>
            <View style={styles.demoHeader}>
              <Ionicons name="flask" size={18} color={colors.accent} />
              <Text style={styles.demoTitle}>מצב דמו — סימולציית רכישה</Text>
            </View>
            <Text style={styles.demoHint}>
              דמו של postback מרשת השותפים: הזינו סכום רכישה וצרו קאשבק "ממתין"
              בארנק.
            </Text>
            <Input
              label="סכום רכישה (₪)"
              value={orderAmount}
              onChangeText={setOrderAmount}
              keyboardType="numeric"
              placeholder="250"
            />
            <Text style={styles.demoEstimate}>
              קאשבק צפוי:{" "}
              {formatMoney(
                computeUserCashback(store, Number(orderAmount) || 0),
              )}
            </Text>
            <Button
              label="סימולציית רכישה"
              variant="secondary"
              onPress={onSimulate}
              loading={simulating}
            />
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  loading: {
    textAlign: "center",
    marginTop: spacing.xxl,
    color: colors.textMuted,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: rtl.start,
    ...shadow.sm,
  },
  hero: { alignItems: "center", gap: spacing.sm },
  logo: {
    width: 88,
    height: 88,
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoImg: { width: "100%", height: "100%" },
  logoText: { fontSize: 40, fontWeight: "900", color: colors.textInverse },
  name: { fontSize: font.xxl, fontWeight: "900", color: colors.textInverse },
  category: { fontSize: font.md, color: "#EDEBFF" },
  cashbackPill: {
    marginTop: spacing.sm,
    backgroundColor: colors.textInverse,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  cashbackPillText: {
    fontSize: font.lg,
    fontWeight: "900",
    color: colors.primary,
  },
  cashbackHint: { fontSize: font.sm, color: "#EDEBFF", marginTop: spacing.xs },
  description: {
    fontSize: font.md,
    color: colors.text,
    textAlign: "right",
    lineHeight: 24,
  },
  stepsTitle: {
    fontSize: font.md,
    fontWeight: "700",
    color: colors.text,
    textAlign: "right",
  },
  stepsText: {
    fontSize: font.sm,
    color: colors.textMuted,
    textAlign: "right",
    lineHeight: 22,
  },
  demoCard: {
    borderColor: colors.accent,
    borderStyle: "dashed",
    gap: spacing.sm,
  },
  demoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    justifyContent: "flex-end",
  },
  demoTitle: {
    fontSize: font.md,
    fontWeight: "700",
    color: colors.accent,
    textAlign: "right",
  },
  demoHint: {
    fontSize: font.sm,
    color: colors.textMuted,
    textAlign: "right",
    lineHeight: 20,
  },
  demoEstimate: {
    fontSize: font.md,
    fontWeight: "700",
    color: colors.primaryDark,
    textAlign: "right",
  },
});
