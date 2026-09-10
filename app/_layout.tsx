import { useEffect } from "react";
import { I18nManager, Platform, StyleSheet, View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
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

  return <Stack screenOptions={{ headerShown: false, animation: "fade" }} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <ThemeProvider>
        <AuthProvider>
          {/* בדפדפן: ממרכזים את התוכן לעמודה ברוחב מובייל כדי שלא יימתח על כל המסך. */}
          <View style={styles.backdrop}>
            <View style={styles.frame}>
              <AuthGate />
            </View>
          </View>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const isWeb = Platform.OS === "web";

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: isWeb ? colors.backdrop : colors.bg,
    alignItems: "center",
  },
  frame: {
    flex: 1,
    width: "100%",
    backgroundColor: colors.bg,
    ...(isWeb ? { maxWidth: 460, ...shadow.md } : null),
  },
});
