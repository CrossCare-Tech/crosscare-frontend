import React, { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Theme } from "@/constants/theme";
import { useGuide } from "@/constants/conciergeGuide";
import LiveBars from "@/components/ui/LiveBars";

const formatTime = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

// Full-screen call with the guide (prototype /concierge/ §4, client favourite, N-01).
// Front-end preview only: the timer runs and the caption is a sample. Live voice needs the backend (D-066).
export default function ConciergeCall() {
  const { t } = useTranslation();
  const router = useRouter();
  const guide = useGuide();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions(); // the portrait is a square as wide as the screen
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const close = () => router.back();

  return (
    <View style={styles.root}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <Image source={guide.portrait} style={{ width, height: width }} resizeMode="cover" accessibilityLabel={guide.name} />
      {/* Fades the portrait into the call gradient that fills the rest of the screen */}
      <LinearGradient
        colors={["rgba(158,115,148,0)", Theme.concierge.callFade]}
        style={[styles.layer, { top: width * 0.45, height: width * 0.55 }]}
        pointerEvents="none"
      />
      <LinearGradient
        colors={[Theme.concierge.callFade, Theme.concierge.callGradient[2], Theme.concierge.callGradient[3]]}
        locations={[0, 0.35, 0.75]}
        style={[styles.layer, { top: width, bottom: 0 }]}
        pointerEvents="none"
      />

      <View style={[styles.top, { top: insets.top + 12 }]}>
        <View style={styles.pill}>
          <View style={styles.dot} />
          <Text style={styles.pillText}>
            {guide.name} · {t("conciergeChat.online")}
          </Text>
        </View>
        <Text style={styles.timer} accessibilityLabel={formatTime(seconds)}>
          {formatTime(seconds)}
        </Text>
      </View>

      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, Theme.spacing.md) + Theme.spacing.sm }]}>
        <View style={styles.state} accessibilityLiveRegion="polite">
          <LiveBars color={Theme.colors.surface} size={14} />
          <Text style={styles.stateText}>{t("conciergeCall.listening")}</Text>
        </View>
        <Text style={styles.caption}>{t("conciergeCall.sample")}</Text>
        <Text style={styles.note}>{t("conciergeCall.preview")}</Text>

        <View style={styles.controls}>
          <Pressable
            onPress={() => setMuted((m) => !m)}
            accessibilityRole="button"
            accessibilityState={{ selected: muted }}
            accessibilityLabel={muted ? t("conciergeCall.unmute") : t("conciergeCall.mute")}
            style={[styles.round, muted && styles.roundOn]}
          >
            <Feather name={muted ? "mic-off" : "mic"} size={22} color={muted ? Theme.colors.ink : Theme.colors.surface} />
          </Pressable>
          <Pressable onPress={close} accessibilityRole="button" style={styles.wide}>
            <Feather name="message-square" size={18} color={Theme.colors.ink} />
            <Text style={styles.wideText}>{t("conciergeCall.back")}</Text>
          </Pressable>
          <Pressable
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel={t("conciergeCall.end")}
            style={[styles.round, styles.end]}
          >
            <Ionicons name="call" size={22} color={Theme.colors.surface} style={styles.endIcon} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.concierge.callGradient[3] },
  layer: { position: "absolute", left: 0, right: 0 },
  top: {
    position: "absolute",
    left: Theme.spacing.md,
    right: Theme.spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.concierge.callPill,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Theme.concierge.presence },
  pillText: { fontFamily: Theme.typography.heading, fontSize: 12, color: Theme.colors.ink },
  timer: {
    fontFamily: Theme.typography.heading,
    fontSize: 13,
    color: Theme.colors.surface,
    backgroundColor: Theme.concierge.callTimer,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Theme.borderRadius.full,
    overflow: "hidden",
  },
  bottom: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 22, gap: 12 },
  state: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.concierge.callGlass,
  },
  stateText: { fontFamily: Theme.typography.subheading, fontSize: 12, color: Theme.colors.surface },
  caption: { fontFamily: Theme.typography.display, fontSize: 20, lineHeight: 28, color: Theme.colors.surface },
  note: { fontFamily: Theme.typography.caption, fontSize: 11, color: Theme.colors.onInkSoft },
  controls: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 14, marginTop: 8 },
  round: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.concierge.callGlass,
    alignItems: "center",
    justifyContent: "center",
  },
  roundOn: { backgroundColor: Theme.colors.surface },
  end: { backgroundColor: Theme.concierge.callEnd },
  endIcon: { transform: [{ rotate: "135deg" }] },
  wide: {
    height: 56,
    paddingHorizontal: 22,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  wideText: { fontFamily: Theme.typography.heading, fontSize: 14, color: Theme.colors.ink },
});
