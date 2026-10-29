import * as FileSystem from "expo-file-system";
import { create } from "zustand";

// Demo mode ("Simulated data" in Settings > Developer) answers every CrossCare API call on the
// device, so the whole app can be shown without a backend. See docs/demo-mode.md.

// Kept in a file instead of AsyncStorage: logout runs AsyncStorage.clear(), and the flag must survive it.
const FLAG_FILE = `${FileSystem.documentDirectory}demo-mode.json`;

// EXPO_PUBLIC_DEMO_MODE=true makes a fresh install start in demo mode (used for client builds).
const DEFAULT_ENABLED = process.env.EXPO_PUBLIC_DEMO_MODE === "true";

// Developer tools are visible unless a build turns them off with EXPO_PUBLIC_DEV_TOOLS=false.
export const DEV_TOOLS_VISIBLE = process.env.EXPO_PUBLIC_DEV_TOOLS !== "false";

type DemoModeState = {
  enabled: boolean;
  loaded: boolean;
  setEnabled: (enabled: boolean) => Promise<void>;
};

export const useDemoMode = create<DemoModeState>((set) => ({
  enabled: DEFAULT_ENABLED,
  loaded: false,
  setEnabled: async (enabled) => {
    set({ enabled });
    try {
      await FileSystem.writeAsStringAsync(FLAG_FILE, JSON.stringify({ enabled }));
    } catch (error) {
      console.warn("[demo] Could not save the demo mode flag:", error);
    }
  },
}));

const load = async () => {
  try {
    const info = await FileSystem.getInfoAsync(FLAG_FILE);
    if (info.exists) {
      const saved = JSON.parse(await FileSystem.readAsStringAsync(FLAG_FILE));
      useDemoMode.setState({ enabled: saved?.enabled === true });
    }
  } catch (error) {
    console.warn("[demo] Could not read the demo mode flag:", error);
  } finally {
    useDemoMode.setState({ loaded: true });
  }
};

// Starts on import so the flag is known before the first request leaves the app.
const loading = load();

export const whenDemoModeLoaded = () => loading;

export const isDemoMode = () => useDemoMode.getState().enabled;
