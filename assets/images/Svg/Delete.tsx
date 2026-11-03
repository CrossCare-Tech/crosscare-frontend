import React from "react";
import { Svg, Path } from "react-native-svg";

interface DeleteProps {
  width?: number;
  height?: number;
  color?: string;
}

const Delete: React.FC<DeleteProps> = ({ 
  width = 24, 
  height = 24, 
  color = "#F66DCE" 
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default Delete;