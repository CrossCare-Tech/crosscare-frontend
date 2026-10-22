import React from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { Theme } from "@/constants/theme";

// Canvas: Lilac Mist (top tint fading into bg). Surface: Meadow (three soft glows).
// Both are decorative and sit behind content, so cards and inputs stay white.
const GLOWS = [
  { id: "mint", cx: "0%", cy: "8%", r: 0.62, color: "#96D7BE", opacity: 0.42 },
  { id: "butter", cx: "100%", cy: "36%", r: 0.66, color: "#FFEBA0", opacity: 0.46 },
  { id: "blush", cx: "10%", cy: "78%", r: 0.68, color: "#FFB4C8", opacity: 0.34 },
];

const ScreenBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={styles.root}>
    {/* Translucent so the lilac canvas shows behind the phone's status bar */}
    <StatusBar style="dark" translucent backgroundColor="transparent" />
    <LinearGradient
      colors={[Theme.colors.canvasTop, Theme.colors.bg]}
      locations={[0, 0.32]}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none" width="100%" height="100%">
      <Defs>
        {GLOWS.map((g) => (
          <RadialGradient key={g.id} id={g.id} cx={g.cx} cy={g.cy} rx={`${g.r * 100}%`} ry={`${g.r * 55}%`} gradientUnits="objectBoundingBox">
            <Stop offset="0" stopColor={g.color} stopOpacity={g.opacity} />
            <Stop offset="1" stopColor={g.color} stopOpacity={0} />
          </RadialGradient>
        ))}
      </Defs>
      {GLOWS.map((g) => (
        <Rect key={g.id} x="0" y="0" width="100%" height="100%" fill={`url(#${g.id})`} />
      ))}
    </Svg>
    {children}
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.colors.bg },
});

export default ScreenBackground;
