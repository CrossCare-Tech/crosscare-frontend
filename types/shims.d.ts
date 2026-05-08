import "react-native-svg";

declare global {
  interface FormData {
    append(name: string, value: any, fileName?: string): void;
  }
}

declare module "react-native-svg" {
  interface PathProps {
    style?: any;
  }

  interface RectProps {
    style?: any;
  }
}
