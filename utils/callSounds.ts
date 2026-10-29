import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";

// Short sounds for the call: a tap, the ring while connecting, the chime when she picks up, and the
// end tone. Generated tones, so there is nothing to license (assets/sounds).
const FILES = {
  tap: require("@/assets/sounds/tap.wav"),
  ring: require("@/assets/sounds/ring.wav"),
  connect: require("@/assets/sounds/connect.wav"),
  end: require("@/assets/sounds/end.wav"),
};

export type CallSound = keyof typeof FILES;

const prepare = () =>
  Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true, shouldDuckAndroid: true });

// A sound that cannot play must never break the call
export const playSound = async (name: CallSound, volume = 0.8) => {
  try {
    await prepare();
    const { sound } = await Audio.Sound.createAsync(FILES[name], { shouldPlay: true, volume });
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) sound.unloadAsync();
    });
  } catch (error) {
    console.warn("[call] Could not play", name, error);
  }
};

// Loops until the returned function is called
export const startRing = async (): Promise<() => void> => {
  try {
    await prepare();
    const { sound } = await Audio.Sound.createAsync(FILES.ring, { shouldPlay: true, isLooping: true, volume: 0.7 });
    return () => {
      sound.stopAsync().then(() => sound.unloadAsync()).catch(() => {});
    };
  } catch (error) {
    console.warn("[call] Could not play the ring", error);
    return () => {};
  }
};

export const buzz = (kind: "tap" | "connect") => {
  const run =
    kind === "connect"
      ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  run.catch(() => {});
};
