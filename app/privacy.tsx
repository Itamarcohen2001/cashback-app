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
    h: "המידע שאנו אוספים",
    p: "כדי לספק את השירות אנו אוספים פרטים בסיסיים שאתם מוסרים: שם מלא, כתובת אימייל ומספר טלפון (לצורך תשלום הקאשבק בביט). כמו כן נשמר מידע על פעילות הקאשבק שלכם באפליקציה.",
  },
  {
    h: "שימוש במידע",
    p: "אנו משתמשים במידע כדי לזהות רכישות שביצעתם דרך הקישורים שלנו, לחשב ולזכות אתכם בקאשבק, לבצע תשלומים, ולתת שירות ותמיכה.",
  },
  {
    h: "שיתוף עם צדדים שלישיים",
    p: "כדי לעקוב אחר רכישות, מזהה אנונימי מועבר לרשת השותפים (Affiliate) של החנות. איננו מוכרים את המידע האישי שלכם לצדדים שלישיים.",
  },
  {
    h: "אבטחת מידע",
    p: "המידע נשמר בשרתים מאובטחים (Supabase) עם הצפנה בתעבורה. אנו נוקטים אמצעים סבירים להגנה על המידע, אך אף שיטה אינה מוגנת ב-100%.",
  },
  {
    h: "הזכויות שלכם",
    p: "אתם רשאים לצפות, לעדכן או למחוק את פרטיכם בכל עת דרך מסך הפרופיל, כולל מחיקת חשבון מלאה. לשאלות בנושא פרטיות ניתן לפנות אלינו.",
  },
];

export default function PrivacyScreen() {
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
          <Text style={styles.title}>מדיניות פרטיות</Text>
        </View>

        <Card style={{ gap: spacing.lg }}>
          {SECTIONS.map((s, i) => (
            <View key={i} style={{ gap: spacing.xs }}>
              <Text style={styles.h}>{s.h}</Text>
              <Text style={styles.p}>{s.p}</Text>
            </View>
          ))}
          <Text style={styles.p}>
            לשאלות בנושא פרטיות ניתן לפנות אלינו במייל: {SUPPORT_EMAIL}
          </Text>
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
