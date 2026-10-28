import * as React from "react";
import Svg, { Path } from "react-native-svg";

// Heart with a pulse line, drawn with strokes so it takes the tab colour like the other tab icons.
const HealthTabIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7 12h3l1.5-2.5L13 14l1.2-2H17"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
export default HealthTabIcon;
