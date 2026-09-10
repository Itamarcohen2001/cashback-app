import { useState } from "react";
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, ScreenHeader } from "@/ui";
import { colors, font, radius, rtl, spacing } from "@/theme";

function openUrl(url: string) {
  if (Platform.OS === "web") window.open(url, "_blank");
  else Linking.openURL(url);
}

export default function ZipScreen() {
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [house, setHouse] = useState("");

  function search() {
    // איתור המיקוד הרשמי מתבצע באתר דואר ישראל.
    openUrl("https://israelpost.co.il/services/zip-code/");
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader title="מאתר מיקוד" />

        <Card style={{ gap: spacing.md }}>
          <Field
            label="יישוב"
            value={city}
            onChange={setCity}
            placeholder="לדוגמה: תל אביב"
            icon="business-outline"
          />
          <Field
            label="רחוב"
            value={street}
            onChange={setStreet}
            placeholder="לדוגמה: דיזנגוף"
            icon="trail-sign-outline"
          />
          <Field
            label="מספר בית"
            value={house}
            onChange={setHouse}
            placeholder="לדוגמה: 100"
            icon="home-outline"
            keyboardType="numeric"
          />
          <Button
            label="איתור מיקוד בדואר ישראל"
            onPress={search}
            icon={
              <Ionicons
                name="open-outline"
                size={18}
                color={colors.textInverse}
              />
            }
          />
        </Card>

        <Text style={styles.note}>
          המיקוד המדויק נשלף ממאגר דואר ישראל הרשמי. חשוב להזין מיקוד נכון בעת
          הזמנה מחו"ל כדי שהחבילה תגיע ליעד.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  icon,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  keyboardType?: "default" | "numeric";
}) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputBox}>
        <Ionicons name={icon} size={20} color={colors.textMuted} />
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType ?? "default"}
          style={styles.input}
        />
      </View>
    </View>
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
  note: {
    fontSize: font.sm,
    color: colors.textMuted,
    textAlign: "right",
    lineHeight: 20,
  },
});
