import { useEffect } from "react";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { useAppleHealth } from "@/zustandStore/useAppleHealthStore";
import { useFitbit } from "@/zustandStore/useFitbitStore";
import { useDemoMode } from "@/utils/demo/demoMode";
import { useDemoWatch } from "@/utils/demo/demoWatch";

export type DeviceSourceId = "apple" | "healthConnect" | "fitbit" | "demoWatch";

export interface DeviceSource {
  id: DeviceSourceId;
  name: string;
  connected: boolean;
  loading: boolean;
  // false when this phone cannot use the source; `note` then says why
  available: boolean;
  note: string | null;
  isDemo: boolean;
  lastSyncAt: string | null;
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
}

// One list of health data sources for every screen that shows or manages connections.
// Apple Health (iOS) and Fitbit (Android) are the real stores; Health Connect is only named until
// its store is restored; the Demo Watch exists only while Simulated data is on.
export function useDeviceSources(): DeviceSource[] {
  const { t } = useTranslation();
  const isIos = Platform.OS === "ios";
  const demoMode = useDemoMode((s) => s.enabled);
  const watch = useDemoWatch();
  const apple = useAppleHealth();
  const fitbit = useFitbit();

  useEffect(() => {
    if (isIos) apple.checkConnection();
  }, []);

  const sources: DeviceSource[] = [
    {
      id: "apple",
      name: "Apple Health",
      connected: apple.isConnected,
      loading: apple.isLoading,
      available: isIos,
      note: isIos ? null : t("devices.iosOnly"),
      isDemo: false,
      lastSyncAt: null,
      connect: apple.connect,
      disconnect: apple.disconnect,
    },
    {
      id: "healthConnect",
      name: "Health Connect",
      connected: false,
      loading: false,
      available: false,
      note: t("devices.comingSoon"),
      isDemo: false,
      lastSyncAt: null,
      connect: async () => false,
      disconnect: async () => {},
    },
    {
      id: "fitbit",
      name: "Fitbit",
      connected: fitbit.isConnected,
      loading: fitbit.isLoading,
      available: !isIos,
      note: isIos ? t("devices.androidOnly") : null,
      isDemo: false,
      lastSyncAt: null,
      connect: fitbit.connect,
      disconnect: fitbit.disconnect,
    },
  ];

  if (demoMode) {
    sources.push({
      id: "demoWatch",
      name: "Demo Watch",
      connected: watch.connected,
      loading: watch.flow !== null,
      available: true,
      note: null,
      isDemo: true,
      lastSyncAt: watch.lastSyncAt,
      connect: async () => {
        watch.connect(); // runs the pairing and sync animation in the background
        return true;
      },
      disconnect: watch.disconnect,
    });
  }

  return sources;
}
