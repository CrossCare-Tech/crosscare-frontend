import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeBack } from "@/hooks/useSafeBack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Theme } from "@/constants/theme";
import { useGuide } from "@/constants/conciergeGuide";
import { CallTopic, callLang } from "@/constants/callScript";
import { CallPhase, useCallSimulation } from "@/hooks/useCallSimulation";
import { useSelector } from "react-redux";

const formatTime = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

const BAR_SHAPE = [0.4, 0.7, 1, 0.7, 0.4];

// Bars that follow how loud the voice is. Same five bars as the chat button, now alive.
const VoiceBars = ({ level, color, size = 16 }: { level: Animated.Value; color: string; size?: number }) => (
  <View style={styles.bars} accessible={false}>
    {BAR_SHAPE.map((shape, i) => (
      <Animated.View
        key={i}
        style={{
          width: 3,
          height: size,
          borderRadius: 2,
          backgroundColor: color,
          transform: [{ scaleY: level.interpolate({ inputRange: [0, 1], outputRange: [0.3 * shape + 0.1, shape] }) }],
        }}
      />
    ))}
  </View>
);

// Three dots that bounce one after the other while the guide thinks
const ThinkingDots = () => {
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    const loops = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 140),
          Animated.timing(dot, { toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 260, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.delay(420 - i * 140),
        ])
      )
    );
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [dots]);
  return (
    <View style={styles.dots} accessible={false}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={[styles.dotThink, { opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }), transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }] }]}
        />
      ))}
    </View>
  );
};

// Rings that spread out from the avatar while the call is connecting
const Rings = () => {
  const rings = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.stagger(
        650,
        rings.map((ring) =>
          Animated.timing(ring, { toValue: 1, duration: 1950, easing: Easing.out(Easing.quad), useNativeDriver: true })
        )
      )
    );
    loop.start();
    return () => loop.stop();
  }, [rings]);
  return (
    <>
      {rings.map((ring, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={[
            styles.ring,
            {
              opacity: ring.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.55, 0] }),
              transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [1, 2.3] }) }],
            },
          ]}
        />
      ))}
    </>
  );
};

const stateKey = (phase: CallPhase) =>
  ({
    calling: "calling",
    greeting: "speaking",
    guideSpeaking: "speaking",
    listening: "listening",
    userSpeaking: "hearing",
    thinking: "thinking",
    ended: "ended",
  })[phase];

// Appends a line to the chat history so the call leaves a summary in the conversation
const saveSummary = async (content: string) => {
  try {
    const saved = await AsyncStorage.getItem("chatHistory");
    const history = saved ? JSON.parse(saved) : [];
    history.push({
      id: `call-${Date.now()}`,
      isUser: false,
      type: "text",
      content,
      timestamp: new Date().toISOString(),
    });
    await AsyncStorage.setItem("chatHistory", JSON.stringify(history));
  } catch (error) {
    console.warn("[call] Could not save the call summary:", error);
  }
};

// Full-screen call with the guide (prototype /concierge/ §4, client favourite, N-01).
// There is no microphone yet: the patient taps a suggestion and it is "heard", and the guide answers
// out loud with the same voices as the reply player. Live voice needs the backend (D-066).
export default function ConciergeCall() {
  const { t, i18n } = useTranslation();
  const guide = useGuide();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions(); // the portrait is a square as wide as the screen
  const user = useSelector((state: any) => state.user);
  const [muted, setMuted] = useState(false);
  const idleLevel = useRef(new Animated.Value(0)).current;
  const language = callLang(i18n.language);
  const call = useCallSimulation({ name: user?.user_name || "Maya", language, muted });
  const close = useSafeBack("/patient/concierge-history");

  const connected = call.phase !== "calling";
  const talking = call.phase === "greeting" || call.phase === "guideSpeaking" || call.phase === "userSpeaking";

  // Fade in when the screen opens; cross-fade from the avatar to the full portrait when she answers
  const enter = useRef(new Animated.Value(0)).current;
  const reveal = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [enter]);
  useEffect(() => {
    if (connected) Animated.timing(reveal, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }).start();
  }, [connected, reveal]);

  const hangUp = () => {
    const { seconds, topics } = call.end();
    const time = formatTime(seconds);
    const about = topics.map((topic: CallTopic) => topic.summary[language]).join(", ");
    saveSummary(
      about
        ? `${t("conciergeCall.summary", { time })} ${t("conciergeCall.summaryTopics", { topics: about })}`
        : t("conciergeCall.summary", { time })
    );
    setTimeout(close, 1100);
  };

  const speaker = call.caption?.speaker === "you" ? t("conciergeCall.you") : guide.name;
  const stateText = t(`conciergeCall.state_${stateKey(call.phase)}`, { name: guide.name });

  return (
    <Animated.View style={[styles.root, { opacity: enter, transform: [{ scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) }] }]}>
      <StatusBar style={connected ? "dark" : "light"} translucent backgroundColor="transparent" />

      {/* Connecting: the avatar with rings spreading out */}
      <Animated.View
        style={[styles.layer, styles.callingLayer, { opacity: reveal.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={[Theme.concierge.callGradient[1], Theme.concierge.callGradient[2], Theme.concierge.callGradient[3]]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.avatarWrap}>
          {!connected && <Rings />}
          <Image source={guide.portrait} style={styles.avatar} accessibilityLabel={guide.name} />
        </View>
        <Text style={styles.callingName}>{guide.name}</Text>
        <Text style={styles.callingText}>{t("conciergeCall.state_calling", { name: guide.name })}</Text>
      </Animated.View>

      {/* Connected: the full portrait fading into the call gradient */}
      <Animated.View style={[styles.layer, { opacity: reveal }]} pointerEvents="none">
        <Image source={guide.portrait} style={{ width, height: width }} resizeMode="cover" accessibilityLabel={guide.name} />
        <LinearGradient
          colors={["rgba(158,115,148,0)", Theme.concierge.callFade]}
          style={[styles.layer, { top: width * 0.45, height: width * 0.55 }]}
        />
        <LinearGradient
          colors={[Theme.concierge.callFade, Theme.concierge.callGradient[2], Theme.concierge.callGradient[3]]}
          locations={[0, 0.35, 0.75]}
          style={[styles.layer, { top: width, bottom: 0 }]}
        />
        {/* A soft glow at the foot of the portrait that swells with the voice */}
        <Animated.View style={[styles.glow, { top: width * 0.55, opacity: talking ? call.level.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.7] }) : 0 }]}>
          <LinearGradient colors={["rgba(230,27,141,0)", "rgba(230,27,141,0.55)"]} style={StyleSheet.absoluteFill} />
        </Animated.View>
      </Animated.View>

      <View style={[styles.top, { top: insets.top + 12 }]}>
        <View style={styles.pill}>
          <View style={[styles.dot, !connected && styles.dotCalling]} />
          <Text style={styles.pillText}>
            {guide.name} · {connected ? t("conciergeChat.online") : t("conciergeCall.callingShort")}
          </Text>
        </View>
        <Text style={styles.timer} accessibilityLabel={formatTime(call.seconds)}>
          {formatTime(call.seconds)}
        </Text>
      </View>

      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, Theme.spacing.md) + Theme.spacing.sm }]}>
        {connected && (
          <View style={styles.state} accessibilityLiveRegion="polite">
            {call.phase === "thinking" ? <ThinkingDots /> : <VoiceBars level={talking ? call.level : idleLevel} color={Theme.colors.surface} />}
            <Text style={styles.stateText}>{stateText}</Text>
          </View>
        )}

        {call.caption && call.phase !== "ended" && (
          <View>
            <Text style={styles.speaker}>{speaker}</Text>
            <Text style={[styles.caption, call.caption.speaker === "you" && styles.captionYou]}>
              {call.caption.words.map((word, i) => {
                const lit = i < call.caption!.shown;
                if (call.caption!.speaker === "you" && !lit) return null;
                return (
                  <Text key={i} style={lit ? styles.wordOn : styles.wordOff}>
                    {word}{" "}
                  </Text>
                );
              })}
            </Text>
          </View>
        )}

        {call.phase === "listening" && (
          <View>
            <Text style={styles.tapToSay}>{t("conciergeCall.tapToSay")}</Text>
            <View style={styles.chips}>
              {call.suggestions.map((topic) => (
                <Pressable
                  key={topic.id}
                  onPress={() => call.talk(topic)}
                  accessibilityRole="button"
                  accessibilityLabel={topic.said[language]}
                  style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
                >
                  <Feather name="mic" size={13} color={Theme.colors.surface} />
                  <Text style={styles.chipText}>{topic.chip[language]}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {call.phase === "ended" ? (
          <Text style={styles.ended}>
            {t("conciergeCall.ended")} · {formatTime(call.seconds)}
          </Text>
        ) : (
          <>
            <Text style={styles.note}>{t("conciergeCall.simulated")}</Text>
            <View style={styles.controls}>
              <Pressable
                onPress={() => setMuted((m) => !m)}
                accessibilityRole="button"
                accessibilityState={{ selected: muted }}
                accessibilityLabel={muted ? t("conciergeCall.unmute") : t("conciergeCall.mute")}
                style={[styles.round, muted && styles.roundOn]}
              >
                <Feather name={muted ? "volume-x" : "volume-2"} size={22} color={muted ? Theme.colors.ink : Theme.colors.surface} />
              </Pressable>
              <Pressable onPress={hangUp} accessibilityRole="button" style={styles.wide}>
                <Feather name="message-square" size={18} color={Theme.colors.ink} />
                <Text style={styles.wideText}>{t("conciergeCall.back")}</Text>
              </Pressable>
              <Pressable
                onPress={hangUp}
                accessibilityRole="button"
                accessibilityLabel={t("conciergeCall.end")}
                style={[styles.round, styles.end]}
              >
                <Ionicons name="call" size={22} color={Theme.colors.surface} style={styles.endIcon} />
              </Pressable>
            </View>
          </>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.concierge.callGradient[3] },
  layer: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },
  callingLayer: { alignItems: "center", justifyContent: "center", gap: 10 },
  avatarWrap: { width: 148, height: 148, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  avatar: { width: 148, height: 148, borderRadius: 74, borderWidth: 3, borderColor: Theme.concierge.callPill },
  ring: {
    position: "absolute",
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: 2,
    borderColor: Theme.concierge.callPill,
  },
  callingName: { fontFamily: Theme.typography.display, fontSize: 28, color: Theme.colors.surface },
  callingText: { fontFamily: Theme.typography.subheading, fontSize: 14, color: Theme.colors.onInkSoft },
  glow: { position: "absolute", left: 0, right: 0, height: 140 },
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
  dotCalling: { backgroundColor: Theme.colors.caution },
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
  bars: { flexDirection: "row", alignItems: "center", justifyContent: "center", height: 16, gap: 3 },
  dots: { flexDirection: "row", alignItems: "center", gap: 4, height: 16 },
  dotThink: { width: 6, height: 6, borderRadius: 3, backgroundColor: Theme.colors.surface },
  speaker: { fontFamily: Theme.typography.heading, fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase", color: Theme.concierge.callPill, marginBottom: 4 },
  caption: { fontFamily: Theme.typography.display, fontSize: 20, lineHeight: 28 },
  captionYou: { fontStyle: "italic" },
  wordOn: { color: Theme.colors.surface },
  wordOff: { color: Theme.colors.onInkLine },
  tapToSay: { fontFamily: Theme.typography.caption, fontSize: 11, color: Theme.colors.onInkSoft, marginBottom: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.concierge.callGlass,
    borderWidth: 1,
    borderColor: Theme.colors.onInkLine,
  },
  chipPressed: { backgroundColor: Theme.colors.onInkLine },
  chipText: { fontFamily: Theme.typography.heading, fontSize: 13, color: Theme.colors.surface },
  note: { fontFamily: Theme.typography.caption, fontSize: 11, color: Theme.colors.onInkSoft },
  ended: { fontFamily: Theme.typography.display, fontSize: 22, color: Theme.colors.surface, textAlign: "center", paddingVertical: 24 },
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
