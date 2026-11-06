import React from "react";
import Svg from "react-native-svg";

// Stroke icon matching the prototype's `.i` class (24x24 viewBox, round caps)
const LineIcon = ({
  size = 17,
  color,
  strokeWidth = 2,
  children,
}: {
  size?: number;
  color: string;
  strokeWidth?: number;
  children: React.ReactNode;
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </Svg>
);

export default LineIcon;
