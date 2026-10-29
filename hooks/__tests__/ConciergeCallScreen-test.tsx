import React from "react";
import { act, create } from "react-test-renderer";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));
jest.mock("react-redux", () => ({ useSelector: () => ({ user_name: "Maya" }) }));
jest.mock("expo-linear-gradient", () => ({ LinearGradient: () => null }));
jest.mock("expo-status-bar", () => ({ StatusBar: () => null }));
jest.mock("@expo/vector-icons", () => ({ Feather: () => null, Ionicons: () => null }));
jest.mock("react-native-safe-area-context", () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) }));
jest.mock("@/hooks/useSafeBack", () => ({ useSafeBack: () => jest.fn() }));
jest.mock("@/constants/conciergeGuide", () => ({ useGuide: () => ({ name: "Sofia", portrait: 0 }) }));
jest.mock("@react-native-async-storage/async-storage", () => ({ getItem: jest.fn().mockResolvedValue(null), setItem: jest.fn() }));
jest.mock("@/utils/callSounds", () => ({ playSound: jest.fn(), startRing: async () => () => {}, buzz: jest.fn() }));
jest.mock("@/utils/replyAudio", () => ({
  estimateSeconds: () => 2,
  replyAudio: { subscribe: () => () => {}, play: jest.fn().mockResolvedValue(undefined), stop: jest.fn() },
}));

import ConciergeCall from "@/app/patient/concierge-call";

describe("call screen", () => {
  it("shows the connecting state, then the suggestions even if the voice never reports back", async () => {
    jest.useFakeTimers();
    let tree: any;
    await act(async () => {
      tree = create(<ConciergeCall />);
    });
    const text = () => JSON.stringify(tree.toJSON());
    expect(text()).toContain("conciergeCall.state_calling");

    for (let i = 0; i < 200; i++) {
      await act(async () => {
        jest.advanceTimersByTime(50);
      });
    }
    // The mocked voice never reports "finished": the safety net moves on and she starts listening
    expect(text()).toContain("conciergeCall.state_listening");
    expect(text()).toContain("conciergeCall.tapToSay");
    expect(text()).toContain("conciergeCall.back");
    jest.useRealTimers();
  });
});
