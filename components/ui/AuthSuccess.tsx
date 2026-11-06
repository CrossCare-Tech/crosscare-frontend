import React, { useEffect, useRef } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Theme } from "@/constants/theme";
import ScreenBackground from "@/components/ui/ScreenBackground";

interface AuthSuccessProps {
  title: string;
  message: string;
  buttonLabel: string;
  onPress: () => void;
  autoCloseMs?: number; // leaves the screen on its own after this delay
}

const AuthSuccess: React.FC<AuthSuccessProps> = ({
  title,
  message,
  buttonLabel,
  onPress,
  autoCloseMs = 3000,
}) => {
  const chipScale = useRef(new Animated.Value(0.4)).current;
  const chipOpacity = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const onPressRef = useRef(onPress);
  onPressRef.current = onPress;

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let animations: Animated.CompositeAnimation[] = [];

    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (cancelled) return;

      if (reduceMotion) {
        chipScale.setValue(1);
        chipOpacity.setValue(1);
        textFade.setValue(1);
      } else {
        animations = [
          Animated.parallel([
            Animated.spring(chipScale, {
              toValue: 1,
              friction: 5,
              tension: 90,
              useNativeDriver: true,
            }),
            Animated.timing(chipOpacity, {
              toValue: 1,
              duration: 220,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(ring, {
            toValue: 1,
            duration: 900,
            delay: 150,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(textFade, {
            toValue: 1,
            duration: 450,
            delay: 250,
            useNativeDriver: true,
          }),
        ];
        animations.forEach((animation) => animation.start());
      }

      Animated.timing(progress, {
        toValue: 1,
        duration: autoCloseMs,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
      timer = setTimeout(() => onPressRef.current(), autoCloseMs);
    });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      animations.forEach((animation) => animation.stop());
      progress.stopAnimation();
    };
  }, [autoCloseMs, chipOpacity, chipScale, progress, ring, textFade]);

  const ringScale = ring.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] });
  const ringOpacity = ring.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.35, 0] });
  const textTranslate = textFade.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });
  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  return (
    <ScreenBackground>
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.chipWrap}>
          <Animated.View
            style={[styles.ring, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]}
          />
          <Animated.View
            style={[styles.chip, { opacity: chipOpacity, transform: [{ scale: chipScale }] }]}
          >
            <Feather name="check" size={34} color={Theme.colors.success} />
          </Animated.View>
        </View>
        <Animated.View
          style={{ opacity: textFade, transform: [{ translateY: textTranslate }] }}
          accessibilityLiveRegion="polite"
        >
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
        </Animated.View>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.bar, { width: barWidth }]} />
      </View>
      <TouchableOpacity
        style={styles.button}
        onPress={onPress}
        activeOpacity={0.88}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>{buttonLabel}</Text>
      </TouchableOpacity>
    </SafeAreaView>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 24,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chipWrap: {
    width: 84,
    height: 84,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  ring: {
    position: "absolute",
    width: 84,
    height: 84,
    borderRadius: 28,
    backgroundColor: Theme.colors.success,
  },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Theme.colors.hairline,
    overflow: "hidden",
    marginBottom: 16,
  },
  bar: {
    height: "100%",
    backgroundColor: Theme.colors.success,
  },
  chip: {
    width: 84,
    height: 84,
    borderRadius: 28,
    backgroundColor: Theme.colors.successTint,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontFamily: Theme.typography.display,
    color: Theme.colors.ink,
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    fontFamily: Theme.typography.body,
    color: Theme.colors.inkSoft,
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 280,
  },
  button: {
    backgroundColor: Theme.colors.magenta,
    height: 52,
    borderRadius: Theme.borderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    ...Theme.shadows.card,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: Theme.typography.heading,
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
});

export default AuthSuccess;
