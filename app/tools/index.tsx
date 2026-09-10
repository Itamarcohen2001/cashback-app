import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader } from "@/ui";
import { colors, font, radius, rtl, shadow, spacing } from "@/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const TOOLS: Array<{
  route: string;
  title: string;
  desc: string;
  icon: IconName;
  color: string;
}> = [
  {
    route: "/tools/calculator",
    title: "מחשבון קאשבק",
    desc: "כמה כסף תחזירו על הרכישה",
    icon: "calculator",
    color: colors.primary,
  },
  {
    route: "/tools/currency",
    title: "ממיר מטבע",
    desc: "המרה בין דולר, אירו ושקל",
    icon: "swap-horizontal",
    color: "#0EA5E9",
  },
  {
    route: "/tools/tax",
    title: "מחשבון מס יבוא",
    desc: 'מכס ומע"מ על קנייה מחו"ל',
    icon: "receipt",
    color: "#F59E0B",
  },
  {
    route: "/tools/tracking",
    title: "מעקב חבילות",
    desc: "איפה המשלוח שלכם עכשיו",
    icon: "cube",
    color: "#00C48C",
  },
  {
    route: "/tools/zip",
    title: "מאתר מיקוד",
    desc: "מציאת מיקוד לפי כתובת",
    icon: "location",
    color: "#EC4899",
  },
  {
    route: "/tools/guide",
    title: "איך זה עובד",
    desc: "מדריך קאשבק וטיפים",
    icon: "help-buoy",
    color: "#A855F7",
  },
];

export default function ToolsHubScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="כלים שימושיים"
          subtitle={'כל מה שצריך לקנייה חכמה מחו"ל ובארץ'}
        />
        <View style={styles.grid}>
          {TOOLS.map((t) => (
            <Pressable
              key={t.route}
              onPress={() => router.push(t.route as never)}
              style={({ pressed }) => [
                styles.tile,
                shadow.sm,
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.icon, { backgroundColor: t.color + "1F" }]}>
                <Ionicons name={t.icon} size={26} color={t.color} />
              </View>
              <Text style={styles.tileTitle}>{t.title}</Text>
              <Text style={styles.tileDesc} numberOfLines={2}>
                {t.desc}
              </Text>
            </Pressable>
          ))}
        </View>
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
  grid: {
    flexDirection: rtl.row,
    flexWrap: "wrap",
    gap: spacing.md,
  },
  tile: {
    width: "47.5%",
    flexGrow: 1,
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  tileTitle: {
    fontSize: font.md,
    fontWeight: "800",
    color: colors.text,
    textAlign: "right",
  },
  tileDesc: {
    fontSize: font.sm,
    color: colors.textMuted,
    textAlign: "right",
    lineHeight: 18,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
});
