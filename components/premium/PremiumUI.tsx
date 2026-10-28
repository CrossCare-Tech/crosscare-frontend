import React from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";
import LineIcon from "@/components/profile/LineIcon";
import { PremiumStatus } from "@/zustandStore/premiumStore";

// Same sparkle as the AI Concierge button in the dock
const SPARKLE = "M12 2.5l2.2 6.8L21 11.5l-6.8 2.2L12 20.5l-2.2-6.8L3 11.5l6.8-2.2z";
const BRAND_GRADIENT: [string, string] = [Theme.colors.magentaVivid, Theme.colors.purple];

// Colour and icon of each status: sparkle (active), clock (ending soon), lock (inactive)
export const PREMIUM_STYLE: Record<PremiumStatus, { color: string; tint: string; icon: React.ReactNode }> = {
  active: {
    color: Theme.colors.purple,
    tint: Theme.colors.purpleTint,
    icon: <Path d={SPARKLE} />,
  },
  expiring: {
    color: Theme.colors.magenta,
    tint: Theme.colors.magentaTint,
    icon: (
      <>
        <Circle cx="12" cy="12" r="8.5" />
        <Path d="M12 7.5V12l3 2" />
      </>
    ),
  },
  inactive: {
    color: Theme.colors.inkFaint,
    tint: Theme.colors.surfaceSunken,
    icon: <LockPath />,
  },
};

export function LockPath() {
  return (
    <>
      <Rect x="5" y="11" width="14" height="10" rx="2" />
      <Path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  );
}

// Round chip with the status icon
export const PremiumIcon = ({ status, size = 44 }: { status: PremiumStatus; size?: number }) => {
  const style = PREMIUM_STYLE[status];
  return (
    <View style={[styles.icon, { width: size, height: size, borderRadius: size / 2, backgroundColor: style.tint }]}>
      <LineIcon size={Math.round(size * 0.48)} color={style.color}>
        {style.icon}
      </LineIcon>
    </View>
  );
};

// Status tag. Active is filled with the Concierge gradient, ending soon keeps the gradient only as
// its outline (still Premium, fading out), inactive is an empty dashed slot.
export const PremiumBadge = ({
  status,
  label,
  style: extra,
}: {
  status: PremiumStatus;
  label?: string; // defaults to the status name
  style?: StyleProp<ViewStyle>;
}) => {
  const { t } = useTranslation();
  const text = label ?? t(`premium.status_${status}`);

  if (status === "active") {
    return (
      <LinearGradient
        colors={BRAND_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.badge, extra]}
      >
        <Svg width={11} height={11} viewBox="0 0 24 24" fill={Theme.colors.surface}>
          <Path d={SPARKLE} />
        </Svg>
        <Text style={[styles.badgeText, { color: Theme.colors.surface }]}>{text}</Text>
      </LinearGradient>
    );
  }

  if (status === "expiring") {
    return (
      <LinearGradient
        colors={BRAND_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.outline, extra]}
      >
        <View style={[styles.badge, styles.badgeExpiring]}>
          <LineIcon size={12} color={Theme.colors.magenta} strokeWidth={2.2}>
            {PREMIUM_STYLE.expiring.icon}
          </LineIcon>
          <Text style={[styles.badgeText, { color: Theme.colors.magenta }]}>{text}</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.badge, styles.badgeInactive, extra]}>
      <LineIcon size={12} color={Theme.colors.inkSoft} strokeWidth={2.2}>
        <LockPath />
      </LineIcon>
      <Text style={[styles.badgeText, { color: Theme.colors.inkSoft }]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  icon: {
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 24,
    paddingHorizontal: 9,
    borderRadius: Theme.borderRadius.sm,
  },
  // 1px gradient ring around the white "ending soon" tag
  outline: {
    padding: 1,
    borderRadius: Theme.borderRadius.sm + 1,
  },
  badgeExpiring: {
    height: 22,
    backgroundColor: Theme.colors.surface,
  },
  badgeInactive: {
    height: 24,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: Theme.colors.dropzoneBorder,
    backgroundColor: Theme.colors.surface,
  },
  badgeText: {
    fontFamily: Theme.typography.heading,
    fontSize: 11.5,
    letterSpacing: 0.2,
  },
});
