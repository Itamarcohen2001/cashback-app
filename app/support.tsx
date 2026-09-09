import { useState } from "react";
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card } from "@/ui";
import { colors, font, radius, rtl, spacing } from "@/theme";
import { SUPPORT_EMAIL } from "@/lib/constants";

const FAQ = [
  {
    q: "מה זה קאשבק ואיך זה עובד?",
    a: 'קאשבק הוא החזר כספי על קניות. בוחרים חנות באפליקציה, מפעילים קאשבק ונכנסים לאתר החנות דרך הקישור שלנו. לאחר שהרכישה מאושרת ע"י החנות, חלק מהעמלה חוזר אליכם ככסף אמיתי.',
  },
  {
    q: "מתי הקאשבק שלי מאושר?",
    a: 'הקאשבק נכנס תחילה כ"ממתין". החנות מאשרת את הרכישה לאחר תקופת המתנה (בדרך כלל 30–90 יום, כדי לוודא שאין ביטול/החזרה). לאחר האישור הסכום הופך ל"מאושר" וניתן למשיכה.',
  },
  {
    q: "איך אני מושך את הכסף?",
    a: 'כשמגיעים לסכום המינימלי למשיכה, נכנסים ל"ארנק" ולוחצים על בקשת משיכה. התשלום מתבצע לביט לפי מספר הטלפון שהזנתם בפרופיל.',
  },
  {
    q: "למה הקאשבק לא נרשם?",
    a: "כדי שהקאשבק ייקלט, חשוב להיכנס לחנות דרך הקישור באפליקציה, לא לחסום עוגיות (cookies), ולא לעבור לאתרים/קופונים אחרים באמצע הרכישה. אם רכישה לא נקלטה — שלחו לנו פנייה ונבדוק.",
  },
  {
    q: "האם השירות בתשלום?",
    a: "לא. השימוש באפליקציה חינמי לחלוטין — אנחנו מקבלים עמלה מהחנויות ומחזירים לכם חלק ממנה.",
  },
];

export default function SupportScreen() {
  const router = useRouter();
  const [open, setOpen] = useState<number | null>(null);

  function contact(subject: string) {
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
    if (Platform.OS === "web") {
      window.open(url, "_self");
    } else {
      Linking.openURL(url);
    }
  }

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
          <Text style={styles.title}>תמיכה ועזרה</Text>
        </View>

        <Card style={{ gap: spacing.sm }}>
          <Text style={styles.sectionTitle}>שאלות נפוצות</Text>
          {FAQ.map((item, i) => {
            const expanded = open === i;
            return (
              <View key={i} style={styles.faqItem}>
                <Pressable
                  style={styles.faqHead}
                  onPress={() => setOpen(expanded ? null : i)}
                >
                  <Ionicons
                    name={expanded ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={colors.textMuted}
                  />
                  <Text style={styles.faqQ}>{item.q}</Text>
                </Pressable>
                {expanded ? <Text style={styles.faqA}>{item.a}</Text> : null}
              </View>
            );
          })}
        </Card>

        <Card style={{ gap: spacing.md }}>
          <Text style={styles.sectionTitle}>לא מצאתם תשובה?</Text>
          <Text style={styles.help}>
            נשמח לעזור בכל שאלה, בעיה או בקשה. שלחו לנו פנייה ונחזור אליכם
            בהקדם.
          </Text>
          <Button
            label="שליחת בקשת תמיכה"
            onPress={() => contact("בקשת תמיכה - CashyCash")}
            icon={
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={20}
                color={colors.textInverse}
              />
            }
          />
          <Button
            label="דיווח על קאשבק חסר"
            variant="secondary"
            onPress={() => contact("דיווח על קאשבק חסר - CashyCash")}
            icon={
              <Ionicons
                name="alert-circle-outline"
                size={20}
                color={colors.primary}
              />
            }
          />
          <Pressable
            onPress={() => contact("פנייה - CashyCash")}
            style={styles.mailRow}
          >
            <Ionicons name="mail-outline" size={18} color={colors.primary} />
            <Text style={styles.mail}>{SUPPORT_EMAIL}</Text>
          </Pressable>
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
  sectionTitle: {
    fontSize: font.lg,
    fontWeight: "800",
    color: colors.text,
    textAlign: "right",
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
  faqHead: { flexDirection: rtl.row, alignItems: "center", gap: spacing.sm },
  faqQ: {
    flex: 1,
    fontSize: font.md,
    fontWeight: "700",
    color: colors.text,
    textAlign: "right",
  },
  faqA: {
    fontSize: font.md,
    color: colors.textMuted,
    textAlign: "right",
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  help: {
    fontSize: font.md,
    color: colors.textMuted,
    textAlign: "right",
    lineHeight: 22,
  },
  mailRow: {
    flexDirection: rtl.row,
    alignItems: "center",
    gap: spacing.sm,
    justifyContent: "center",
    marginTop: spacing.xs,
  },
  mail: { fontSize: font.md, color: colors.primary, fontWeight: "700" },
});
