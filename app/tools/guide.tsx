import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Card, ScreenHeader } from "@/ui";
import { colors, font, radius, rtl, spacing } from "@/theme";

const STEPS: Array<{
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  text: string;
}> = [
  {
    icon: "search",
    title: "בוחרים חנות",
    text: "מחפשים באפליקציה את החנות שבה רוצים לקנות מתוך מאות חנויות.",
  },
  {
    icon: "flash",
    title: "מפעילים קאשבק",
    text: "לוחצים על 'הפעלת קאשבק' ונכנסים לאתר החנות דרך הקישור שלנו.",
  },
  {
    icon: "cart",
    title: "קונים כרגיל",
    text: "משלימים את הרכישה באתר החנות בדיוק כמו תמיד, ללא שינוי.",
  },
  {
    icon: "wallet",
    title: "מקבלים כסף בחזרה",
    text: "לאחר אישור הרכישה הקאשבק נכנס לארנק וניתן למשיכה לביט.",
  },
];

const TIPS = [
  "היכנסו לחנות תמיד דרך הקישור באפליקציה — כך הרכישה נקלטת.",
  "אל תשתמשו בקופונים מאתרים אחרים באמצע הרכישה, זה עלול לבטל את הקאשבק.",
  "אפשרו עוגיות (cookies) בדפדפן כדי שהמעקב יעבוד.",
  "השלימו את הרכישה באותו ביקור — אל תשאירו את העגלה לימים.",
];

export default function GuideScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="איך זה עובד" />

        <Card style={{ gap: spacing.lg }}>
          <Text style={styles.sectionTitle}>4 צעדים פשוטים</Text>
          {STEPS.map((step, i) => (
            <View key={i} style={styles.step}>
              <View style={styles.stepIcon}>
                <Ionicons name={step.icon} size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>
                  {i + 1}. {step.title}
                </Text>
                <Text style={styles.stepText}>{step.text}</Text>
              </View>
            </View>
          ))}
        </Card>

        <Card style={{ gap: spacing.md }}>
          <Text style={styles.sectionTitle}>טיפים לקאשבק מוצלח 💡</Text>
          {TIPS.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={colors.accent}
              />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </Card>
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
  sectionTitle: {
    fontSize: font.lg,
    fontWeight: "800",
    color: colors.text,
    textAlign: "right",
  },
  step: { flexDirection: rtl.row, gap: spacing.md, alignItems: "flex-start" },
  stepIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  stepTitle: {
    fontSize: font.md,
    fontWeight: "800",
    color: colors.text,
    textAlign: "right",
  },
  stepText: {
    fontSize: font.sm,
    color: colors.textMuted,
    textAlign: "right",
    lineHeight: 20,
    marginTop: 2,
  },
  tipRow: { flexDirection: rtl.row, gap: spacing.sm, alignItems: "flex-start" },
  tipText: {
    flex: 1,
    fontSize: font.md,
    color: colors.text,
    textAlign: "right",
    lineHeight: 22,
  },
});
