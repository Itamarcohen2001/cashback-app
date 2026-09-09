import { useEffect } from "react";
import { I18nManager, Platform, StyleSheet, View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { colors, shadow } from "@/theme";

// כפיית כיווניות RTL עבור ממשק בעברית.
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

function AuthGate() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!user && !inAuthGroup) {
      router.replace("/(auth)/sign-in");
    } else if (user && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [user, loading, segments]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        {/* בדפדפן: ממרכזים את התוכן לעמודה ברוחב מובייל כדי שלא יימתח על כל המסך. */}
        <View style={styles.backdrop}>
          <View style={styles.frame}>
            <AuthGate />
          </View>
        </View>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const isWeb = Platform.OS === "web";

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: isWeb ? "#E9EAF2" : colors.bg,
    alignItems: "center",
  },
  frame: {
    flex: 1,
    width: "100%",
    backgroundColor: colors.bg,
    ...(isWeb ? { maxWidth: 460, ...shadow.md } : null),
  },
});
