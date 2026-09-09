import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@/ui";
import { colors, font, radius, rtl, spacing } from "@/theme";
import { SUPPORT_EMAIL } from "@/lib/constants";

const SECTIONS = [
  {
    h: "כללי",
    p: 'שימוש באפליקציית CashyCash ("השירות") מהווה הסכמה לתנאי שימוש אלה. אם אינכם מסכימים לתנאים, אנא הימנעו משימוש בשירות.',
  },
  {
    h: "אופן פעולת הקאשבק",
    p: "הקאשבק מותנה ברכישה שמבוצעת דרך הקישורים באפליקציה ובאישורה הסופי ע\"י החנות ורשת השותפים. סכומים ושיעורים המוצגים באפליקציה הם הערכה ועשויים להשתנות בהתאם לתנאי החנות.",
  },
  {
    h: "זיכוי ותשלום",
    p: "קאשבק שאושר ניתן למשיכה בכפוף לסכום מינימלי. התשלום מבוצע לביט לפי מספר הטלפון שמסרתם. באחריותכם לוודא שהפרטים נכונים ומעודכנים.",
  },
  {
    h: "ביטולים והחזרות",
    p: "אם רכישה בוטלה, הוחזרה או לא אושרה ע\"י החנות, הקאשבק המתאים לא ישולם או יבוטל בהתאם.",
  },
  {
    h: "אחריות",
    p: "השירות ניתן כפי שהוא (AS IS). איננו אחראים לזמינות החנויות, לתנאי הרכישה שלהן, או לעיכובים באישור/תשלום שמקורם בחנות או ברשת השותפים.",
  },
  {
    h: "שינויים בתנאים",
    p: "אנו רשאים לעדכן תנאים אלה מעת לעת. המשך השימוש בשירות לאחר עדכון מהווה הסכמה לתנאים המעודכנים.",
  },
];

export default function TermsScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/(tabs)")
            }
            style={styles.backBtn}
          >
            <Ionicons name="chevron-forward" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>תנאי שימוש</Text>
        </View>

        <Card style={{ gap: spacing.lg }}>
          {SECTIONS.map((s, i) => (
            <View key={i} style={{ gap: spacing.xs }}>
              <Text style={styles.h}>{s.h}</Text>
              <Text style={styles.p}>{s.p}</Text>
            </View>
          ))}
          <Text style={styles.p}>לשאלות ניתן לפנות אלינו במייל: {SUPPORT_EMAIL}</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 60 },
  headerRow: { flexDirection: rtl.row, alignItems: "center", gap: spacing.sm },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontSize: font.xxl, fontWeight: "900", color: colors.text },
  h: {
    fontSize: font.lg,
    fontWeight: "800",
    color: colors.text,
    textAlign: "right",
  },
  p: {
    fontSize: font.md,
    color: colors.textMuted,
    textAlign: "right",
    lineHeight: 22,
  },
});
