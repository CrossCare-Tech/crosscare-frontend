import React from "react";
import { StyleSheet, View } from "react-native";

// Five rounded sound bars: the "talk out loud" symbol (prototype .chat-live, like Gemini Live).
const HEIGHTS = [0.4, 0.7, 1, 0.7, 0.4];

const LiveBars: React.FC<{ color: string; size?: number }> = ({ color, size = 22 }) => {
  const barWidth = Math.max(2, Math.round(size / 7));
  return (
    <View style={[styles.row, { height: size, gap: barWidth }]} accessible={false}>
      {HEIGHTS.map((h, i) => (
        <View key={i} style={{ width: barWidth, height: size * h, borderRadius: barWidth, backgroundColor: color }} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
});

export default LiveBars;
