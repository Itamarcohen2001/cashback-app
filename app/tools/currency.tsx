import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Card, GradientCard, ScreenHeader } from "@/ui";
import { colors, font, gradients, radius, rtl, spacing } from "@/theme";

type Code = "USD" | "EUR" | "GBP" | "ILS" | "CNY";

const CURRENCIES: Array<{ code: Code; label: string; flag: string }> = [
  { code: "USD", label: "דולר", flag: "🇺🇸" },
  { code: "EUR", label: "אירו", flag: "🇪🇺" },
  { code: "GBP", label: 'ליש"ט', flag: "🇬🇧" },
  { code: "ILS", label: "שקל", flag: "🇮🇱" },
  { code: "CNY", label: "יואן", flag: "🇨🇳" },
];

// שערים משוערים לגיבוי אם אין רשת (יחסית ל-USD).
const FALLBACK: Record<Code, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  ILS: 3.7,
  CNY: 7.2,
};

export default function CurrencyScreen() {
  const [rates, setRates] = useState<Record<Code, number>>(FALLBACK);
  const [live, setLive] = useState(false);
  const [updated, setUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState<Code>("USD");
  const [to, setTo] = useState<Code>("ILS");

  const load = useCallback(async () => {
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/USD");
      const data = await res.json();
      if (data?.rates?.ILS) {
        setRates({
          USD: 1,
          EUR: data.rates.EUR ?? FALLBACK.EUR,
          GBP: data.rates.GBP ?? FALLBACK.GBP,
          ILS: data.rates.ILS ?? FALLBACK.ILS,
          CNY: data.rates.CNY ?? FALLBACK.CNY,
        });
        setLive(true);
        if (data.time_last_update_utc) {
          try {
            setUpdated(
              new Date(data.time_last_update_utc).toLocaleDateString("he-IL", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              }),
            );
          } catch {
            // מתעלמים מפורמט תאריך.
          }
        }
      }
    } catch {
      // נשארים עם שערי הגיבוי.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const amountNum = Number(amount.replace(/[^0-9.]/g, "")) || 0;
  const result = useMemo(() => {
    // ממירים דרך USD: amount(from) -> USD -> to.
    const inUsd = amountNum / rates[from];
    return inUsd * rates[to];
  }, [amountNum, from, to, rates]);

  function swap() {
    setFrom(to);
    setTo(from);
  }

  const fmt = new Intl.NumberFormat("he-IL", { maximumFractionDigits: 2 });

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader title="ממיר מטבע" />

        <Card style={{ gap: spacing.md }}>
          <Text style={styles.label}>סכום</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            style={styles.amountInput}
          />

          <Text style={styles.label}>ממטבע</Text>
          <CurrencyRow value={from} onChange={setFrom} />

          <Pressable style={styles.swapBtn} onPress={swap}>
            <Ionicons name="swap-vertical" size={20} color={colors.primary} />
            <Text style={styles.swapText}>החלפה</Text>
          </Pressable>

          <Text style={styles.label}>למטבע</Text>
          <CurrencyRow value={to} onChange={setTo} />
        </Card>

        <GradientCard colors={gradients.primary as unknown as string[]} glow>
          <Text style={styles.resultLabel}>
            {fmt.format(amountNum)} {from} =
          </Text>
          <Text style={styles.resultValue}>
            {fmt.format(result)} {to}
          </Text>
          <Text style={styles.resultSub}>
            {loading ? (
              <ActivityIndicator color="#EDEBFF" />
            ) : (
              `1 ${from} = ${fmt.format(rates[to] / rates[from])} ${to}`
            )}
          </Text>
        </GradientCard>

        <Text style={styles.note}>
          {live
            ? `השערים הרשמיים מתעדכנים אחת ליום${updated ? ` · עודכן ${updated}` : ""}.`
            : "מוצגים שערים משוערים (אין חיבור לרשת)."}{" "}
          החישוב אינו כולל עמלת המרה של חברת האשראי (~2%–3%).
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function CurrencyRow({
  value,
  onChange,
}: {
  value: Code;
  onChange: (c: Code) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.currencyRow}
    >
      {CURRENCIES.map((c) => (
        <Pressable
          key={c.code}
          onPress={() => onChange(c.code)}
          style={[styles.chip, value === c.code && styles.chipActive]}
        >
          <Text style={styles.chipFlag}>{c.flag}</Text>
          <Text
            style={[styles.chipText, value === c.code && styles.chipTextActive]}
          >
            {c.code}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
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
  amountInput: {
    height: 60,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    fontSize: font.xxl,
    fontWeight: "900",
    color: colors.text,
    textAlign: "right",
    borderWidth: 1,
    borderColor: colors.border,
  },
  currencyRow: { gap: spacing.sm, paddingVertical: 2, paddingHorizontal: 2 },
  chip: {
    flexDirection: rtl.row,
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.bg,
    borderWidth: 2,
    borderColor: "transparent",
  },
  chipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  chipFlag: { fontSize: font.md },
  chipText: { fontSize: font.sm, fontWeight: "800", color: colors.textMuted },
  chipTextActive: { color: colors.primaryDark },
  swapBtn: {
    flexDirection: rtl.row,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    alignSelf: "center",
  },
  swapText: { fontSize: font.sm, fontWeight: "800", color: colors.primary },
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
  resultSub: {
    fontSize: font.sm,
    color: "#EDEBFF",
    textAlign: "center",
    marginTop: spacing.xs,
  },
  note: {
    fontSize: font.sm,
    color: colors.textMuted,
    textAlign: "right",
    lineHeight: 20,
  },
});
