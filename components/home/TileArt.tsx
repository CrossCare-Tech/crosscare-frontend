import React from "react";
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Rect, Stop } from "react-native-svg";

// Illustrations drawn in the bottom-right corner of the Home tiles (prototype version B).
// Like the other illustrations in assets/images/Svg, they keep their own artwork colors.
// Pressure and glucose are not in the prototype and follow the same style.

type Props = { size?: number };

export const WaterArt = ({ size = 52 }: Props) => (
  <Svg width={size} height={size} viewBox="0 0 64 64">
    <Defs>
      <LinearGradient id="gw" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#A9D0FF" />
        <Stop offset="1" stopColor="#5B8FF0" />
      </LinearGradient>
    </Defs>
    <Rect x="24" y="4" width="16" height="8" rx="2.5" fill="#7A6CF0" />
    <Path d="M25 12h14l5 9v31a7 7 0 0 1-7 7H27a7 7 0 0 1-7-7V21z" fill="url(#gw)" />
    <Path d="M21 36c6-4 11 3 22-1v17a6 6 0 0 1-6 6H27a6 6 0 0 1-6-6z" fill="#fff" opacity={0.35} />
    <Path d="M9 22c-3 5-1 8 1.6 8s3.6-3.4 1.4-8z" fill="#8DBBFF" />
  </Svg>
);

export const FoodArt = ({ size = 52 }: Props) => (
  <Svg width={size} height={size} viewBox="0 0 64 64">
    <Path d="M5 30h54a27 27 0 0 1-54 0z" fill="#fff" />
    <Path d="M5 30h54" stroke="#F0D5E0" strokeWidth={2} />
    <Circle cx="18" cy="27" r="8" fill="#6CC27B" />
    <Circle cx="31" cy="25" r="7" fill="#F0625F" />
    <Circle cx="44" cy="28" r="7" fill="#FFB85C" />
    <Ellipse cx="38" cy="19" rx="9" ry="6" fill="#fff" />
    <Circle cx="38" cy="19" r="3.2" fill="#FFC93C" />
    <Circle cx="24" cy="18" r="5" fill="#8ED081" />
  </Svg>
);

export const StepsArt = ({ size = 52 }: Props) => (
  <Svg width={size} height={size} viewBox="0 0 64 64">
    <Defs>
      <LinearGradient id="gs" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#7FE3C2" />
        <Stop offset="1" stopColor="#2FB892" />
      </LinearGradient>
    </Defs>
    <Path d="M5 40c0-7 4-11 10-11 3 0 4 2 7 3l8 3c6 2 13 3 19 7 2 1 3 3 3 5H8a3 3 0 0 1-3-3z" fill="url(#gs)" />
    <Path d="M5 47h54v3a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" fill="#fff" />
    <Path d="M24 34l3 3M30 36l3 3M36 38l3 3" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
    <Path d="M52 18c-2 3-1 5 1 5s2.4-2.4 1-5z" fill="#7FE3C2" />
  </Svg>
);

export const DueArt = ({ size = 52 }: Props) => (
  <Svg width={size} height={size} viewBox="0 0 64 64">
    <Defs>
      <LinearGradient id="gc" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#B7A2FF" />
        <Stop offset="1" stopColor="#7A5CF0" />
      </LinearGradient>
    </Defs>
    <Rect x="9" y="12" width="46" height="44" rx="9" fill="url(#gc)" />
    <Rect x="9" y="23" width="46" height="33" rx="9" fill="#fff" />
    <Rect x="19" y="5" width="6" height="14" rx="3" fill="#6D4FE0" />
    <Rect x="39" y="5" width="6" height="14" rx="3" fill="#6D4FE0" />
    <Path d="M32 49s-10-6-10-12.5a5.5 5.5 0 0 1 10-3 5.5 5.5 0 0 1 10 3C42 43 32 49 32 49z" fill="#9D6BF2" />
  </Svg>
);

export const PressureArt = ({ size = 52 }: Props) => (
  <Svg width={size} height={size} viewBox="0 0 64 64">
    <Defs>
      <LinearGradient id="gp" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#FF9AA8" />
        <Stop offset="1" stopColor="#E8506A" />
      </LinearGradient>
    </Defs>
    <Path d="M32 56S8 42 8 25a12 12 0 0 1 24-4 12 12 0 0 1 24 4c0 17-24 31-24 31z" fill="url(#gp)" />
    <Path d="M14 33h9l4-8 6 15 4-7h13" stroke="#fff" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const GlucoseArt = ({ size = 52 }: Props) => (
  <Svg width={size} height={size} viewBox="0 0 64 64">
    <Defs>
      <LinearGradient id="gg" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#FFD27A" />
        <Stop offset="1" stopColor="#F5A524" />
      </LinearGradient>
    </Defs>
    <Path d="M32 6C24 18 16 27 16 38a16 16 0 0 0 32 0C48 27 40 18 32 6z" fill="url(#gg)" />
    <Path d="M23 41l6-6 5 4 7-9" stroke="#fff" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="50" cy="14" r="4" fill="#FFD27A" />
  </Svg>
);
