import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import Svg, { Path } from "react-native-svg";
import * as Haptics from "expo-haptics";
import HomeIcon from "@/assets/images/Svg/HomeIcon";
import JournalIcon from "@/assets/images/Svg/JournalIcon";
import ProfileIcon from "@/assets/images/Svg/ProfileIcon";
import HealthTabIcon from "@/assets/images/Svg/HealthTabIcon";
import { Theme } from "@/constants/theme";

// Concierge Dock (prototype Direction A, D-063): Home · Journal · [AI Concierge] · Health · Profile.
// The centre is an action (it opens the chat), so it never shows an active state.
const SLOTS = ["home", "journal", "concierge", "health", "profile"] as const;
const FAB_SIZE = 56;

const Sparkle = () => (
  <Svg width={26} height={26} viewBox="0 0 24 24" fill={Theme.colors.surface}>
    <Path d="M12 2l2.2 6.8L21 11l-6.8 2.2L12 20l-2.2-6.8L3 11l6.8-2.2z" />
  </Svg>
);

const ConciergeDock: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const activeName = state.routes[state.index]?.name;

  const titles: Record<string, string> = {
    home: t("home.title"),
    journal: t("journals"),
    health: t("nav.health"),
    profile: t("profile.title"),
  };
  const icons: Record<string, (color: string) => React.ReactNode> = {
    home: (c) => <HomeIcon color={c} size={22} />,
    journal: (c) => <JournalIcon color={c} size={22} />,
    health: (c) => <HealthTabIcon color={c} size={22} />,
    profile: (c) => <ProfileIcon color={c} size={22} />,
  };

  const openTab = (name: string) => {
    const route = state.routes.find((r) => r.name === name);
    if (!route) return;
    const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
    if (activeName !== name && !event.defaultPrevented) navigation.navigate(route.name, route.params);
  };

  const openConcierge = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push({ pathname: "/patient/askdoula", params: { from_modal: "true" } });
  };

  return (
    <View
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, Theme.spacing.sm) }]}
      pointerEvents="box-none"
    >
      <View style={styles.dock} accessibilityRole="tablist" accessibilityLabel={t("nav.main")}>
        {SLOTS.map((name) => {
          if (name === "concierge") {
            return (
              <View key={name} style={styles.slot}>
                <Pressable
                  onPress={openConcierge}
                  accessibilityRole="button"
                  accessibilityLabel={t("nav.concierge")}
                  style={styles.centerHit}
                >
                  <LinearGradient
                    colors={[Theme.colors.magentaVivid, Theme.colors.purple]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.fab}
                  >
                    <Sparkle />
                  </LinearGradient>
                  <View style={styles.aiBadge}>
                    <Text style={styles.aiBadgeText}>AI</Text>
                  </View>
                  <Text style={styles.centerLabel}>{t("nav.concierge")}</Text>
                </Pressable>
              </View>
            );
          }
          const active = activeName === name;
          const color = active ? Theme.colors.magenta : Theme.colors.inkFaint;
          return (
            <Pressable
              key={name}
              style={styles.slot}
              onPress={() => openTab(name)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={titles[name]}
            >
              <View style={[styles.iconPill, active && styles.iconPillActive]}>{icons[name](color)}</View>
              <Text style={[styles.label, { color }]} numberOfLines={1}>
                {titles[name]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // The wrap is transparent so the Lilac Mist canvas shows around the floating dock.
  wrap: {
    paddingHorizontal: 14,
    paddingTop: FAB_SIZE / 2,
    backgroundColor: "transparent",
  },
  dock: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: Theme.spacing.sm,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderRadius: Theme.borderRadius.xl,
    ...Theme.shadows.soft,
  },
  slot: { flex: 1, alignItems: "center", gap: Theme.spacing.xs, minWidth: 0 },
  iconPill: { width: 42, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  iconPillActive: { backgroundColor: Theme.colors.magentaTint },
  label: { fontFamily: Theme.typography.heading, fontSize: 10 },
  centerHit: { alignItems: "center", alignSelf: "stretch", height: 42 },
  fab: {
    position: "absolute",
    top: -(FAB_SIZE / 2) - 10,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    borderWidth: 4,
    borderColor: Theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...Theme.shadows.soft,
  },
  aiBadge: {
    position: "absolute",
    top: -(FAB_SIZE / 2) - 15,
    right: 0,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderRadius: Theme.borderRadius.full,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  aiBadgeText: { fontFamily: Theme.typography.heading, fontSize: 8, color: Theme.colors.ink },
  centerLabel: {
    position: "absolute",
    bottom: 0,
    fontFamily: Theme.typography.heading,
    fontSize: 9.5,
    color: Theme.colors.magenta,
  },
});

export default ConciergeDock;
