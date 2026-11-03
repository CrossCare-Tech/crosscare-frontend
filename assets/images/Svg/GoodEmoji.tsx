import * as React from "react";
import Svg, { Path } from "react-native-svg";
const GoodEmoji = (props:any) => (
  <Svg
    width={25}
    height={24}
    viewBox="0 0 25 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <Path
      d="M12.3359 22C17.8588 22 22.3359 17.5228 22.3359 12C22.3359 6.47715 17.8588 2 12.3359 2C6.81309 2 2.33594 6.47715 2.33594 12C2.33594 17.5228 6.81309 22 12.3359 22Z"
      stroke="#70D95C"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8.33594 14C8.33594 14 9.83594 16 12.3359 16C14.8359 16 16.3359 14 16.3359 14"
      stroke="#70D95C"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9.33594 9H9.34594"
      stroke="#70D95C"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M15.3359 9H15.3459"
      stroke="#70D95C"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
export default GoodEmoji;
