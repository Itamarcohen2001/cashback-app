import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadow } from "@/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: true,
        tabBarStyle: {
          position: "absolute",
          left: 16,
          right: 16,
          bottom: Platform.OS === "ios" ? 24 : 16,
          height: 68,
          paddingBottom: Platform.OS === "ios" ? 0 : 8,
          paddingTop: 8,
          borderRadius: radius.xl,
          borderTopWidth: 0,
          backgroundColor: colors.card,
          ...shadow.md,
        },
        tabBarItemStyle: { paddingVertical: 4 },
        tabBarLabelStyle: { fontWeight: "700", fontSize: 12 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "חנויות",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "storefront" : "storefront-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: "ארנק",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "wallet" : "wallet-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "פרופיל",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );
}
