import { useState } from "react";
import {
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, ScreenHeader } from "@/ui";
import { colors, font, radius, rtl, spacing } from "@/theme";

function openUrl(url: string) {
  if (Platform.OS === "web") window.open(url, "_blank");
  else Linking.openURL(url);
}

const CARRIERS: Array<{ name: string; url: (n: string) => string }> = [
  { name: "17track (הכול)", url: (n) => `https://t.17track.net/en#nums=${n}` },
  {
    name: "דואר ישראל",
    url: (n) =>
      `https://israelpost.co.il/itemtrace/?itemcode=${encodeURIComponent(n)}`,
  },
  {
    name: "Cainiao",
    url: (n) => `https://global.cainiao.com/detail.htm?mailNoList=${n}`,
  },
];

export default function TrackingScreen() {
  const [num, setNum] = useState("");
  const trimmed = num.trim();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader title="מעקב חבילות" />

        <Card style={{ gap: spacing.md }}>
          <Text style={styles.label}>מספר מעקב (Tracking Number)</Text>
          <View style={styles.inputBox}>
            <Ionicons name="cube-outline" size={20} color={colors.textMuted} />
            <TextInput
              value={num}
              onChangeText={setNum}
              placeholder="לדוגמה: LP123456789IL"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              style={styles.input}
            />
          </View>
          <Text style={styles.hint}>
            הזינו את מספר המעקב שקיבלתם מהחנות, ובחרו חברת שילוח למעקב.
          </Text>
        </Card>

        <View style={{ gap: spacing.sm }}>
          {CARRIERS.map((c) => (
            <Button
              key={c.name}
              label={`מעקב דרך ${c.name}`}
              variant="secondary"
              disabled={!trimmed}
              onPress={() => openUrl(c.url(trimmed))}
              icon={
                <Ionicons
                  name="open-outline"
                  size={18}
                  color={colors.primary}
                />
              }
            />
          ))}
        </View>

        <Text style={styles.note}>
          המעקב מתבצע באתר חברת השילוח. עדכון סטטוס עשוי לקחת מספר ימים מרגע
          השליחה.
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
  input: {
    flex: 1,
    height: "100%",
    fontSize: font.md,
    fontWeight: "700",
    color: colors.text,
    textAlign: "right",
  },
  hint: {
    fontSize: font.sm,
    color: colors.textMuted,
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
