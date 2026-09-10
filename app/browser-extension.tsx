import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Card, GradientCard, ScreenHeader } from "@/ui";
import { colors, font, gradients, radius, rtl, spacing } from "@/theme";

const BENEFITS: Array<{
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  text: string;
}> = [
  {
    icon: "notifications",
    title: "תזכורת אוטומטית",
    text: "כשתגיעו לאתר של חנות נתמכת, נזכיר לכם להפעיל קאשבק בלחיצה אחת.",
  },
  {
    icon: "flash",
    title: "הפעלה מיידית",
    text: "אין צורך לחפש באפליקציה — הקאשבק מופעל ישירות מהדפדפן.",
  },
  {
    icon: "pricetags",
    title: "קופונים אוטומטיים",
    text: "התוסף יבדוק וימלא עבורכם קודי קופון זמינים בקופה.",
  },
  {
    icon: "shield-checkmark",
    title: "פרטיות מלאה",
    text: "התוסף פועל רק באתרי החנויות הנתמכות ולא אוסף מידע אישי.",
  },
];

export default function BrowserExtensionScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="תוסף הדפדפן" />

        <GradientCard colors={gradients.primary as unknown as string[]} glow>
          <View style={styles.heroIcon}>
            <Ionicons
              name="extension-puzzle"
              size={34}
              color={colors.textInverse}
            />
          </View>
          <Text style={styles.heroTitle}>קאשבק בלי לשכוח, אף פעם</Text>
          <Text style={styles.heroSub}>
            התוסף מזהה אוטומטית מתי אתם באתר של חנות נתמכת ומפעיל עבורכם קאשבק —
            כדי שלא תפספסו אף החזר.
          </Text>
          <View style={styles.soonBadge}>
            <Ionicons name="time" size={16} color={colors.primaryDark} />
            <Text style={styles.soonText}>בקרוב ל-Chrome ו-Edge</Text>
          </View>
        </GradientCard>

        <View style={{ gap: spacing.md }}>
          {BENEFITS.map((b, i) => (
            <Card key={i} style={styles.benefitRow}>
              <View style={styles.benefitIcon}>
                <Ionicons name={b.icon} size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.benefitTitle}>{b.title}</Text>
                <Text style={styles.benefitText}>{b.text}</Text>
              </View>
            </Card>
          ))}
        </View>

        <Text style={styles.note}>
          עד שהתוסף יעלה לאוויר — פשוט היכנסו לחנות דרך האפליקציה כדי לצבור
          קאשבק על כל רכישה.
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
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  heroTitle: {
    fontSize: font.xl,
    fontWeight: "900",
    color: colors.textInverse,
    textAlign: "center",
    marginTop: spacing.md,
  },
  heroSub: {
    fontSize: font.sm,
    color: "#EDEBFF",
    textAlign: "center",
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  soonBadge: {
    flexDirection: rtl.row,
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "center",
    backgroundColor: colors.textInverse,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  soonText: { fontSize: font.sm, fontWeight: "800", color: colors.primaryDark },
  benefitRow: {
    flexDirection: rtl.row,
    alignItems: "center",
    gap: spacing.md,
  },
  benefitIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitTitle: {
    fontSize: font.md,
    fontWeight: "800",
    color: colors.text,
    textAlign: "right",
  },
  benefitText: {
    fontSize: font.sm,
    color: colors.textMuted,
    textAlign: "right",
    lineHeight: 20,
    marginTop: 2,
  },
  note: {
    fontSize: font.sm,
    color: colors.textMuted,
    textAlign: "right",
    lineHeight: 20,
  },
});
