import { ImageSourcePropType } from "react-native";

// Media that can come with a Concierge reply (screen 6d of the prototype). The server sends it as
// JSON next to the text, from the reviewed content library (Contentful); it is never generated.
export type ReplyMedia =
  | { type: "image"; url?: string; asset?: string; alt: string; title: string; note: string }
  | { type: "video"; url: string; posterUrl?: string; title: string; durationSec: number }
  | { type: "link"; url: string; title: string; domain: string; label: string }
  | { type: "actions"; title: string; actions: ("save" | "remind")[] };

// Images that ship inside the app, for content that must work offline (and for demo mode).
export const LOCAL_MEDIA: Record<string, ImageSourcePropType> = {
  "baby-w24": require("@/assets/images/baby/w24.jpg"),
};

export const imageSource = (media: Extract<ReplyMedia, { type: "image" }>): ImageSourcePropType | null =>
  media.asset && LOCAL_MEDIA[media.asset] ? LOCAL_MEDIA[media.asset] : media.url ? { uri: media.url } : null;

export const formatDuration = (seconds: number) => {
  const total = Math.round(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};
