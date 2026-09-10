import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
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
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { brandLogoCandidates, formatDate, formatUserCashback } from "@/lib/format";
import { Coupon, Store } from "@/lib/types";
import { colors, font, gradients, radius, rtl, shadow, spacing } from "@/theme";

/** שלד טעינה פועם (Skeleton) — לתצוגת placeholder בזמן שליפת נתונים. */
export function Skeleton({
  width,
  height,
  radius: r = radius.md,
  style,
}: {
  width?: number | `${number}%`;
  height: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const opacity = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View
      style={[
        { width: width ?? "100%", height, borderRadius: r, opacity },
        styles.skeleton,
        style,
      ]}
    />
  );
}

/** שלד לרשת חנויות (3 בשורה) — תצוגת טעינה. */
export function StoreGridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <View style={styles.skeletonGrid}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.skeletonTile}>
          <Skeleton width={72} height={72} radius={18} />
          <Skeleton width={60} height={12} />
          <Skeleton width={72} height={22} radius={radius.pill} />
        </View>
      ))}
    </View>
  );
}

/** מצב ריק מעוצב — אייקון + כותרת + טקסט משנה. */
export function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={34} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

/** כותרת מסך עם כפתור חזרה — עקבי לכל המסכים הפנימיים. */
export function ScreenHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const router = useRouter();
  return (
    <View style={styles.headerRow}>
      <Pressable
        onPress={() =>
          router.canGoBack() ? router.back() : router.replace("/(tabs)")
        }
        style={styles.headerBack}
        accessibilityRole="button"
        accessibilityLabel="חזרה"
      >
        <Ionicons name="chevron-forward" size={22} color={colors.text} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? (
          <Text style={styles.headerSubtitle}>{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );
}

/** כרטיס חנות בפריסת גריד (לוגו + שם + קאשבק + מועדפים). */
export function StoreTile({
  store,
  onPress,
  favorite,
  onToggleFavorite,
}: {
  store: Store;
  onPress: () => void;
  favorite?: boolean;
  onToggleFavorite?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.storeTile,
        shadow.sm,
        pressed && styles.pressed,
      ]}
    >
      {onToggleFavorite ? (
        <View style={styles.storeTileHeart}>
          <HeartButton
            active={Boolean(favorite)}
            onPress={onToggleFavorite}
            size={16}
          />
        </View>
      ) : null}
      <StoreLogo store={store} size={72} cornerRadius={18} />
      <Text style={styles.storeTileName} numberOfLines={1}>
        {store.name}
      </Text>
      <View style={styles.storeTilePill}>
        <Text style={styles.storeTilePillText}>
          {formatUserCashback(store)}
        </Text>
      </View>
    </Pressable>
  );
}

/** לוגו חנות: מנסה מספר מקורות לוגו אמיתיים, ונופל לאות ראשונה אם כולם נכשלו. */
export function StoreLogo({
  store,
  size = 56,
  cornerRadius = radius.md,
  background = colors.card,
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
        borderWidth: 1,
        borderColor: colors.border,
        padding: size * 0.14,
      }}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: "100%", height: "100%" }}
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

/** כפתור מועדפים (❤) — לחיצה מחליפה מצב. */
export function HeartButton({
  active,
  onPress,
  size = 22,
}: {
  active: boolean;
  onPress: () => void;
  size?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={active ? "הסרה ממועדפים" : "הוספה למועדפים"}
      style={({ pressed }) => [
        styles.heartBtn,
        { width: size + 16, height: size + 16 },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons
        name={active ? "heart" : "heart-outline"}
        size={size}
        color={active ? colors.danger : colors.textMuted}
      />
    </Pressable>
  );
}

/** כרטיס קופון/דיל עם קוד להעתקה. */
export function CouponCard({
  coupon,
  onPress,
}: {
  coupon: Coupon;
  onPress?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    if (!coupon.code) return;
    try {
      await Clipboard.setStringAsync(coupon.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // מתעלמים משגיאת העתקה.
    }
  }

  const store = coupon.store;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        shadow.sm,
        { gap: spacing.sm },
        pressed && onPress ? styles.pressed : null,
      ]}
    >
      <View style={styles.couponHeader}>
        {store ? (
          <StoreLogo
            store={{
              name: store.name,
              logo_url: store.logo_url ?? null,
              base_url: store.base_url ?? "",
            }}
            size={44}
          />
        ) : null}
        <View style={{ flex: 1, gap: 2 }}>
          {store ? (
            <Text style={styles.couponStore} numberOfLines={1}>
              {store.name}
            </Text>
          ) : null}
          <Text style={styles.couponTitle} numberOfLines={2}>
            {coupon.title}
          </Text>
        </View>
        {coupon.featured ? (
          <View style={styles.hotBadge}>
            <Text style={styles.hotBadgeText}>🔥 חם</Text>
          </View>
        ) : null}
      </View>

      {coupon.description ? (
        <Text style={styles.couponDesc}>{coupon.description}</Text>
      ) : null}

      {coupon.code ? (
        <Pressable
          onPress={copyCode}
          style={styles.codeRow}
          accessibilityRole="button"
          accessibilityLabel={`העתקת קוד קופון ${coupon.code}`}
        >
          <Ionicons
            name={copied ? "checkmark-circle" : "copy-outline"}
            size={18}
            color={copied ? colors.success : colors.primary}
          />
          <Text style={styles.codeText}>
            {copied ? "הקוד הועתק!" : coupon.code}
          </Text>
          {!copied ? <Text style={styles.codeHint}>הקישו להעתקה</Text> : null}
        </Pressable>
      ) : (
        <View style={styles.autoDeal}>
          <Ionicons name="pricetag" size={16} color={colors.accentDark} />
          <Text style={styles.autoDealText}>דיל אוטומטי — ללא קוד</Text>
        </View>
      )}

      {(() => {
        const exp = couponExpiry(coupon.expires_at);
        if (!exp) return null;
        return (
          <View style={styles.couponExpiry}>
            <Ionicons
              name="time-outline"
              size={14}
              color={exp.soon ? colors.warning : colors.textMuted}
            />
            <Text
              style={[
                styles.couponExpiryText,
                exp.soon && { color: colors.warning },
              ]}
            >
              {exp.label}
            </Text>
          </View>
        );
      })()}
    </Pressable>
  );
}

/** מחשב תווית תפוגה לקופון (null אם אין תאריך או שכבר פג). */
function couponExpiry(
  iso: string | null,
): { label: string; soon: boolean } | null {
  if (!iso) return null;
  const end = new Date(iso).getTime();
  if (Number.isNaN(end)) return null;
  const days = Math.ceil((end - Date.now()) / 86400000);
  if (days < 0) return null;
  if (days === 0) return { label: "נגמר היום", soon: true };
  if (days === 1) return { label: "נגמר מחר", soon: true };
  if (days <= 7) return { label: `נגמר בעוד ${days} ימים`, soon: true };
  return { label: `בתוקף עד ${formatDate(iso)}`, soon: false };
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heartBtn: {
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
    ...shadow.sm,
  },
  couponHeader: {
    flexDirection: rtl.row,
    alignItems: "center",
    gap: spacing.md,
  },
  couponStore: {
    fontSize: font.sm,
    fontWeight: "700",
    color: colors.textMuted,
    textAlign: "right",
  },
  couponTitle: {
    fontSize: font.md,
    fontWeight: "800",
    color: colors.text,
    textAlign: "right",
  },
  couponDesc: {
    fontSize: font.sm,
    color: colors.textMuted,
    textAlign: "right",
    lineHeight: 20,
  },
  hotBadge: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  hotBadgeText: { fontSize: font.sm, fontWeight: "900", color: colors.danger },
  codeRow: {
    flexDirection: rtl.row,
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  codeText: {
    fontSize: font.md,
    fontWeight: "900",
    color: colors.primaryDark,
    letterSpacing: 1,
  },
  codeHint: {
    flex: 1,
    fontSize: font.sm,
    color: colors.textMuted,
    textAlign: "left",
  },
  autoDeal: {
    flexDirection: rtl.row,
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: rtl.start,
  },
  autoDealText: {
    fontSize: font.sm,
    fontWeight: "700",
    color: colors.accentDark,
  },
  couponExpiry: {
    flexDirection: rtl.row,
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: rtl.start,
  },
  couponExpiryText: {
    fontSize: font.sm,
    fontWeight: "700",
    color: colors.textMuted,
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
  headerRow: {
    flexDirection: rtl.row,
    alignItems: "center",
    gap: spacing.md,
  },
  headerBack: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.sm,
  },
  headerTitle: {
    fontSize: font.xxl,
    fontWeight: "900",
    color: colors.text,
    textAlign: "right",
  },
  headerSubtitle: {
    fontSize: font.sm,
    color: colors.textMuted,
    textAlign: "right",
    marginTop: 2,
  },
  storeTile: {
    flex: 1,
    maxWidth: "31.5%",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  storeTileHeart: {
    position: "absolute",
    top: 6,
    insetInlineStart: 6,
    zIndex: 2,
  },
  storeTileName: {
    fontSize: font.md,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  storeTilePill: {
    backgroundColor: colors.accentLight,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
  },
  storeTilePillText: {
    color: colors.accentDark,
    fontWeight: "900",
    fontSize: font.sm,
  },
  skeleton: { backgroundColor: colors.border },
  skeletonGrid: {
    flexDirection: rtl.row,
    flexWrap: "wrap",
    gap: spacing.md,
  },
  skeletonTile: {
    width: "31.5%",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyState: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontSize: font.lg,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: font.md,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
});
