import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { brandLogoCandidates } from "@/lib/format";
import { colors, font, gradients, radius, shadow, spacing } from "@/theme";

/** לוגו חנות: מנסה מספר מקורות לוגו אמיתיים, ונופל לאות ראשונה אם כולם נכשלו. */
export function StoreLogo({
  store,
  size = 56,
  cornerRadius = radius.md,
  background = colors.bg,
  letterColor = colors.primary,
}: {
  store: { name: string; logo_url: string | null; base_url: string };
  size?: number;
  cornerRadius?: number;
  background?: string;
  letterColor?: string;
}) {
  const candidates = useMemo(
    () => brandLogoCandidates(store),
    [store.logo_url, store.base_url],
  );
  const [idx, setIdx] = useState(0);
  const uri = idx < candidates.length ? candidates[idx] : null;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: cornerRadius,
        backgroundColor: background,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: "82%", height: "82%" }}
          resizeMode="contain"
          onError={() => setIdx((i) => i + 1)}
        />
      ) : (
        <Text
          style={{
            fontSize: size * 0.4,
            fontWeight: "900",
            color: letterColor,
          }}
        >
          {store.name.charAt(0)}
        </Text>
      )}
    </View>
  );
}

export function Card({
  children,
  style,
  elevated = true,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
}) {
  return (
    <View style={[styles.card, elevated && shadow.sm, style]}>{children}</View>
  );
}

/** כרטיס עם רקע גרדיאנט — לרכיבים בולטים (ארנק, הירו וכו'). */
export function GradientCard({
  children,
  style,
  colors: gColors = gradients.primary as unknown as string[],
  glow = false,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  colors?: string[];
  glow?: boolean;
}) {
  return (
    <View
      style={[styles.gradientWrap, glow && shadow.glow, !glow && shadow.md]}
    >
      <LinearGradient
        colors={gColors as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientInner, style]}
      >
        {children}
      </LinearGradient>
    </View>
  );
}

export function Button({
  label,
  onPress,
  loading,
  variant = "primary",
  disabled,
  icon,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  const isDisabled = disabled || loading;
  const content = (
    <>
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? colors.textInverse : colors.primary}
        />
      ) : (
        <View style={styles.btnRow}>
          {icon}
          <Text
            style={[
              styles.btnText,
              variant === "primary" && { color: colors.textInverse },
              variant === "danger" && { color: colors.textInverse },
              (variant === "secondary" || variant === "ghost") && {
                color: colors.primary,
              },
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </>
  );

  if (variant === "primary") {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        {({ pressed }) => (
          <View
            style={[
              styles.btnShadow,
              isDisabled && styles.btnDisabled,
              pressed && styles.pressed,
            ]}
          >
            <LinearGradient
              colors={[...gradients.primary] as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btn}
            >
              {content}
            </LinearGradient>
          </View>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.btn,
        variant === "secondary" && styles.btnSecondary,
        variant === "ghost" && styles.btnGhost,
        variant === "danger" && styles.btnDanger,
        isDisabled && styles.btnDisabled,
        pressed && styles.pressed,
      ]}
    >
      {content}
    </Pressable>
  );
}

export function Input(props: TextInputProps & { label?: string }) {
  const { label, style, onFocus, onBlur, ...rest } = props;
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: spacing.xs }}>
      {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[styles.input, focused && styles.inputFocused, style]}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...rest}
      />
    </View>
  );
}

export function Badge({
  text,
  color,
  solid = false,
}: {
  text: string;
  color: string;
  solid?: boolean;
}) {
  return (
    <View
      style={[styles.badge, { backgroundColor: solid ? color : color + "1F" }]}
    >
      <View
        style={[
          styles.dot,
          { backgroundColor: solid ? colors.textInverse : color },
        ]}
      />
      <Text
        style={[
          styles.badgeText,
          { color: solid ? colors.textInverse : color },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gradientWrap: { borderRadius: radius.lg, overflow: "hidden" },
  gradientInner: { borderRadius: radius.lg, padding: spacing.xl },
  btnShadow: { borderRadius: radius.md, ...shadow.glow },
  btn: {
    height: 54,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  btnRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  btnSecondary: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  btnGhost: { backgroundColor: "transparent" },
  btnDanger: { backgroundColor: colors.danger },
  btnDisabled: { opacity: 0.45 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  btnText: { fontSize: font.md, fontWeight: "800" },
  input: {
    height: 54,
    borderWidth: 1.5,
    borderColor: "transparent",
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    fontSize: font.md,
    color: colors.text,
    backgroundColor: colors.bg,
    textAlign: "right",
  },
  inputFocused: { borderColor: colors.primary, backgroundColor: colors.bgAlt },
  inputLabel: {
    fontSize: font.sm,
    color: colors.textMuted,
    fontWeight: "700",
    textAlign: "right",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.pill,
    paddingVertical: 5,
    paddingHorizontal: spacing.md,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: font.sm, fontWeight: "800" },
});
