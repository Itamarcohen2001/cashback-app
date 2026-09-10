import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Card, GradientCard, ScreenHeader } from "@/ui";
import { colors, font, gradients, radius, rtl, spacing } from "@/theme";

const VAT = 0.18; // מע"מ בישראל (2025)
const EXEMPT_USD = 75; // עד סכום זה פטור ממע"מ ומכס
const CUSTOMS_THRESHOLD_USD = 500; // מעל סכום זה עשוי לחול מכס

export default function TaxScreen() {
  const [usdIls, setUsdIls] = useState(3.7);
  const [value, setValue] = useState("");
  const [shipping, setShipping] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/USD");
      const data = await res.json();
      if (data?.rates?.ILS) setUsdIls(data.rates.ILS);
    } catch {
      // נשארים עם שער הגיבוי.
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const valueUsd = Number(value.replace(/[^0-9.]/g, "")) || 0;
  const shippingUsd = Number(shipping.replace(/[^0-9.]/g, "")) || 0;

  const calc = useMemo(() => {
    const baseUsd = valueUsd + shippingUsd;
    const exempt = valueUsd > 0 && valueUsd <= EXEMPT_USD;
    const vatUsd = exempt ? 0 : baseUsd * VAT;
    const mayHaveCustoms = valueUsd > CUSTOMS_THRESHOLD_USD;
    const totalUsd = baseUsd + vatUsd;
    return { exempt, vatUsd, mayHaveCustoms, totalUsd, baseUsd };
  }, [valueUsd, shippingUsd]);

  const fmt = new Intl.NumberFormat("he-IL", { maximumFractionDigits: 0 });
  const ils = (usd: number) => `₪${fmt.format(usd * usdIls)}`;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader title="מחשבון מס יבוא" />

        <Card style={{ gap: spacing.md }}>
          <Text style={styles.label}>מחיר המוצר (בדולרים)</Text>
          <View style={styles.inputBox}>
            <Text style={styles.currency}>$</Text>
            <TextInput
              value={value}
              onChangeText={setValue}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
          </View>

          <Text style={styles.label}>דמי משלוח (בדולרים)</Text>
          <View style={styles.inputBox}>
            <Text style={styles.currency}>$</Text>
            <TextInput
              value={shipping}
              onChangeText={setShipping}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
          </View>
        </Card>

        {calc.exempt ? (
          <GradientCard colors={gradients.money as unknown as string[]} glow>
            <Ionicons
              name="checkmark-circle"
              size={32}
              color={colors.textInverse}
              style={{ alignSelf: "center" }}
            />
            <Text style={styles.exemptTitle}>פטור ממס! 🎉</Text>
            <Text style={styles.exemptSub}>
              קניות עד ${EXEMPT_USD} (ללא דמי משלוח) פטורות ממע"מ וממכס.
            </Text>
          </GradientCard>
        ) : (
          <GradientCard colors={gradients.primary as unknown as string[]} glow>
            <Text style={styles.resultLabel}>מע"מ לתשלום (18%)</Text>
            <Text style={styles.resultValue}>{ils(calc.vatUsd)}</Text>
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>עלות כוללת משוערת</Text>
              <Text style={styles.totalValue}>{ils(calc.totalUsd)}</Text>
            </View>
          </GradientCard>
        )}

        {calc.mayHaveCustoms ? (
          <Card style={styles.warnCard}>
            <Ionicons name="alert-circle" size={20} color={colors.warning} />
            <Text style={styles.warnText}>
              מעל ${CUSTOMS_THRESHOLD_USD} עשוי לחול גם מכס (בדרך כלל 0%–12%,
              תלוי בסוג המוצר) ולעיתים מס קנייה. הסכום כאן כולל מע"מ בלבד.
            </Text>
          </Card>
        ) : null}

        <Text style={styles.note}>
          * חישוב מוערך בלבד לפי כללי היבוא האישי בישראל. שער החליפין: 1$ ≈ ₪
          {usdIls.toFixed(2)}. המס נגבה על מחיר המוצר + המשלוח.
        </Text>
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
  label: {
    fontSize: font.sm,
    fontWeight: "700",
    color: colors.textMuted,
    textAlign: "right",
  },
  inputBox: {
    flexDirection: rtl.row,
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    height: 56,
    borderWidth: 1,
    borderColor: colors.border,
  },
  currency: { fontSize: font.xl, fontWeight: "900", color: colors.textMuted },
  input: {
    flex: 1,
    height: "100%",
    fontSize: font.xl,
    fontWeight: "800",
    color: colors.text,
    textAlign: "right",
  },
  resultLabel: {
    fontSize: font.md,
    fontWeight: "700",
    color: "#EDEBFF",
    textAlign: "center",
  },
  resultValue: {
    fontSize: font.xxxl,
    fontWeight: "900",
    color: colors.textInverse,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginVertical: spacing.md,
  },
  totalRow: {
    flexDirection: rtl.row,
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalLabel: { fontSize: font.md, fontWeight: "700", color: "#EDEBFF" },
  totalValue: {
    fontSize: font.xl,
    fontWeight: "900",
    color: colors.textInverse,
  },
  exemptTitle: {
    fontSize: font.xl,
    fontWeight: "900",
    color: colors.textInverse,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  exemptSub: {
    fontSize: font.sm,
    color: "#EAFBF3",
    textAlign: "center",
    marginTop: spacing.xs,
  },
  warnCard: {
    flexDirection: rtl.row,
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: "#FFF7EB",
    borderColor: "#FFE2B8",
  },
  warnText: {
    flex: 1,
    fontSize: font.sm,
    color: "#8A5A00",
    textAlign: "right",
    lineHeight: 20,
  },
  note: {
    fontSize: font.sm,
    color: colors.textMuted,
    textAlign: "right",
    lineHeight: 20,
  },
});
