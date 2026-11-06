import React, { useMemo, useState } from "react";
import { ActivityIndicator, GestureResponderEvent, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";
import { useReplyAudio } from "@/hooks/useReplyAudio";
import { estimateSeconds, replyAudio } from "@/utils/replyAudio";

const BARS = 26;

// Same bars for the same reply, so the wave does not change between renders
const barHeights = (seed: string) => {
  let value = 7;
  for (let i = 0; i < seed.length; i++) value = (value * 31 + seed.charCodeAt(i)) % 9973;
  return Array.from({ length: BARS }, (_, i) => {
    value = (value * 1103 + 12345 + i) % 9973;
    return 5 + (value % 15);
  });
};

const clock = (ms: number) => {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

type Props = { messageId: string; text: string; language: string };

// "Listen" under a reply: ready, preparing, playing, paused and could-not-load (prototype 6b).
// Nothing plays by itself. Speed cycles 1x, 1.25x, 1.5x and tapping the wave jumps to that point.
export default function ListenPlayer({ messageId, text, language }: Props) {
  const { t } = useTranslation();
  const audio = useReplyAudio(messageId);
  const [width, setWidth] = useState(0);
  const heights = useMemo(() => barHeights(messageId), [messageId]);
  const active = audio.status === "playing" || audio.status === "paused";
  const total = active && audio.durationMs ? audio.durationMs : estimateSeconds(text) * 1000;
  const progress = active && total ? Math.min(audio.positionMs / total, 1) : 0;

  if (audio.status === "error") {
    return (
      <TouchableOpacity
        style={[styles.pill, styles.errorPill]}
        onPress={() => replyAudio.retry()}
        accessibilityRole="button"
        accessibilityLabel={t("replyAudio.unavailable")}
      >
        <View style={[styles.round, styles.errorRound]}>
          <Ionicons name="play" size={14} color={Theme.colors.surface} />
        </View>
        <Text style={styles.errorText}>{t("replyAudio.unavailable")}</Text>
      </TouchableOpacity>
    );
  }

  if (audio.status === "preparing") {
    return (
      <View style={styles.pill} accessibilityLiveRegion="polite">
        <View style={styles.round}>
          <ActivityIndicator size="small" color={Theme.colors.surface} />
        </View>
        <Text style={styles.label}>{t("replyAudio.preparing")}</Text>
      </View>
    );
  }

  if (!active) {
    return (
      <TouchableOpacity
        style={styles.pill}
        onPress={() => replyAudio.play(messageId, text, language)}
        accessibilityRole="button"
        accessibilityLabel={`${t("replyAudio.listen")}, ${clock(total)}`}
      >
        <View style={styles.round}>
          <Ionicons name="play" size={14} color={Theme.colors.surface} style={styles.playIcon} />
        </View>
        <Text style={styles.label}>
          {t("replyAudio.listen")} · {clock(total)}
        </Text>
      </TouchableOpacity>
    );
  }

  const playing = audio.status === "playing";
  const seekable = audio.engine === "deepgram";
  const jump = (event: GestureResponderEvent) => {
    if (seekable && width) replyAudio.seek(event.nativeEvent.locationX / width);
  };

  return (
    <View style={styles.pill}>
      <TouchableOpacity
        style={styles.round}
        onPress={() => (playing ? replyAudio.pause() : replyAudio.resume())}
        accessibilityRole="button"
        accessibilityLabel={playing ? t("replyAudio.pause") : t("replyAudio.play")}
      >
        <Ionicons name={playing ? "pause" : "play"} size={14} color={Theme.colors.surface} style={playing ? undefined : styles.playIcon} />
      </TouchableOpacity>
      <View
        style={styles.wave}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => seekable}
        onResponderRelease={jump}
        accessibilityLabel={t("replyAudio.wave")}
      >
        {heights.map((h, i) => (
          <View
            key={i}
            style={[styles.bar, { height: h }, i / BARS < progress ? styles.barPlayed : styles.barRest]}
          />
        ))}
      </View>
      <Text style={styles.time}>{clock(audio.positionMs)}</Text>
      <TouchableOpacity
        style={styles.speed}
        onPress={() => replyAudio.cycleSpeed()}
        accessibilityRole="button"
        accessibilityLabel={t("replyAudio.speed", { rate: audio.rate })}
      >
        <Text style={styles.speedText}>{audio.rate}×</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 12,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.hairline,
    borderRadius: Theme.borderRadius.full,
  },
  round: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Theme.colors.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  playIcon: { marginLeft: 2 },
  label: { fontFamily: Theme.typography.heading, fontSize: 12, color: Theme.colors.purple },
  wave: { flexDirection: "row", alignItems: "center", gap: 2, height: 24, width: 120 },
  bar: { flex: 1, borderRadius: 2 },
  barPlayed: { backgroundColor: Theme.colors.purple },
  barRest: { backgroundColor: Theme.colors.purpleSoft },
  time: { fontFamily: Theme.typography.caption, fontSize: 11, color: Theme.colors.inkFaint, minWidth: 28 },
  speed: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.purpleTint,
  },
  speedText: { fontFamily: Theme.typography.heading, fontSize: 11, color: Theme.colors.purple },
  errorPill: { backgroundColor: Theme.colors.warningTint, borderColor: Theme.colors.caution },
  errorRound: { backgroundColor: Theme.colors.warning },
  errorText: { fontFamily: Theme.typography.heading, fontSize: 12, color: Theme.colors.warning },
});
