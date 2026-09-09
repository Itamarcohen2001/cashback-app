import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { Button, Card, GradientCard } from "@/ui";
import { colors, font, gradients, radius, rtl, spacing } from "@/theme";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const fullName = user?.full_name || "משתמש";

  const steps = [
    { icon: "storefront-outline", text: "בוחרים חנות ומפעילים קאשבק." },
    { icon: "cart-outline", text: "קונים כרגיל דרך הקישור." },
    {
      icon: "hourglass-outline",
      text: 'הקאשבק נכנס כ"ממתין" ומאושר לאחר אישור החנות.',
    },
    { icon: "cash-outline", text: "מגיעים לסכום המינימלי ומושכים לחשבון." },
  ] as const;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>הפרופיל שלי</Text>

        <GradientCard colors={gradients.primary as unknown as string[]} glow>
          <View style={styles.userRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{fullName.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1, alignItems: rtl.start }}>
              <Text style={styles.name}>{fullName}</Text>
              <Text style={styles.email}>{user?.email}</Text>
              {user?.phone ? (
                <Text style={styles.email}>{user.phone}</Text>
              ) : null}
              {user?.is_admin ? (
                <View style={styles.adminTag}>
                  <Ionicons
                    name="shield-checkmark"
                    size={12}
                    color={colors.textInverse}
                  />
                  <Text style={styles.adminTagText}>מנהל</Text>
                </View>
              ) : null}
            </View>
          </View>
        </GradientCard>

        <Card style={{ gap: spacing.md }}>
          <Text style={styles.infoTitle}>איך זה עובד?</Text>
          {steps.map((s, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepIcon}>
                <Ionicons name={s.icon} size={18} color={colors.primary} />
              </View>
              <Text style={styles.stepText}>{s.text}</Text>
            </View>
          ))}
        </Card>

        {user?.is_admin ? (
          <Button
            label="פאנל ניהול"
            onPress={() => router.push("/admin")}
            icon={
              <Ionicons
                name="options-outline"
                size={20}
                color={colors.textInverse}
              />
            }
          />
        ) : null}

        <Button
          label="עריכת פרופיל"
          variant="secondary"
          onPress={() => router.push("/edit-profile")}
          icon={
            <Ionicons name="create-outline" size={20} color={colors.primary} />
          }
        />

        <Button label="התנתקות" variant="secondary" onPress={signOut} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 130 },
  title: {
    fontSize: font.xxxl,
    fontWeight: "900",
    color: colors.text,
    textAlign: "right",
  },
  userRow: { flexDirection: rtl.row, alignItems: "center", gap: spacing.md },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: font.xxl,
    fontWeight: "900",
    color: colors.textInverse,
  },
  name: {
    fontSize: font.xxl,
    fontWeight: "900",
    color: colors.textInverse,
    textAlign: "right",
  },
  email: {
    fontSize: font.md,
    color: "#EDEBFF",
    marginTop: 2,
    textAlign: "right",
  },
  adminTag: {
    flexDirection: rtl.row,
    alignItems: "center",
    gap: 4,
    marginTop: spacing.sm,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
  },
  adminTagText: {
    color: colors.textInverse,
    fontSize: font.sm,
    fontWeight: "800",
  },
  infoTitle: {
    fontSize: font.lg,
    fontWeight: "800",
    color: colors.text,
    textAlign: "right",
  },
  stepRow: { flexDirection: rtl.row, alignItems: "center", gap: spacing.md },
  stepIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: {
    flex: 1,
    fontSize: font.md,
    color: colors.text,
    textAlign: "right",
  },
});
