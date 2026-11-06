import * as FileSystem from "expo-file-system";
import { create } from "zustand";
import { useDemoMode } from "./demoMode";
import { watchHeart, watchRestingHeartFor, watchSleepFor, watchSleepRange, watchSteps, watchStepsFor } from "./demoWatchData";

// "Demo Watch": a simulated smartwatch for Simulated data mode. It connects without HealthKit,
// Fitbit or an account, and answers steps, resting heart rate and sleep in the shape the real
// stores use. It only counts while Simulated data is on. See docs/demo-mode.md.

export type WatchDataType = "steps" | "heart" | "sleep";

export type WatchSync = {
  at: string; // ISO time of the sync
  steps: number | null;
  heart: number | null;
  sleepHours: number | null;
};

type Saved = {
  connected: boolean;
  lastSyncAt: string | null;
  permissions: Record<WatchDataType, boolean>;
  history: WatchSync[];
};

// The connect and sync animation: look for the watch, then bring in one data type at a time
export type WatchFlow = { stage: "pairing" } | { stage: "syncing"; done: WatchDataType[] };

const DATA_ORDER: WatchDataType[] = ["steps", "heart", "sleep"];
const PAIRING_MS = 1600;
const STEP_MS = 1100;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type DemoWatchState = Saved & {
  loaded: boolean;
  flow: WatchFlow | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  setPermission: (type: WatchDataType, allowed: boolean) => Promise<void>;
  syncNow: () => Promise<void>;
};

// A file, like the demo flag: logout runs AsyncStorage.clear() and the watch should stay paired
const FILE = `${FileSystem.documentDirectory}demo-watch.json`;
const MAX_HISTORY = 20;

const INITIAL: Saved = {
  connected: false,
  lastSyncAt: null,
  permissions: { steps: true, heart: true, sleep: true },
  history: [],
};

const pick = (state: Saved): Saved => ({
  connected: state.connected,
  lastSyncAt: state.lastSyncAt,
  permissions: state.permissions,
  history: state.history,
});

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// What one sync brings in, limited to the data types the patient allowed
const readNow = (permissions: Saved["permissions"]): WatchSync => {
  const now = new Date();
  const today = dayKey(now);
  return {
    at: now.toISOString(),
    steps: permissions.steps ? watchStepsFor(today, now) : null,
    heart: permissions.heart ? watchRestingHeartFor(today) : null,
    sleepHours: permissions.sleep ? Math.round((watchSleepFor(today).duration / 3600000) * 10) / 10 : null,
  };
};

export const useDemoWatch = create<DemoWatchState>((set, get) => {
  const save = async () => {
    try {
      await FileSystem.writeAsStringAsync(FILE, JSON.stringify(pick(get())));
    } catch (error) {
      console.warn("[demo] Could not save the Demo Watch:", error);
    }
  };

  const recordSync = () => {
    const entry = readNow(get().permissions);
    set({ lastSyncAt: entry.at, history: [entry, ...get().history].slice(0, MAX_HISTORY) });
  };

  // One data type at a time, skipping the ones the patient did not allow
  const runSync = async () => {
    const done: WatchDataType[] = [];
    set({ flow: { stage: "syncing", done } });
    for (const type of DATA_ORDER.filter((item) => get().permissions[item])) {
      await wait(STEP_MS);
      done.push(type);
      set({ flow: { stage: "syncing", done: [...done] } });
    }
    await wait(400);
    recordSync();
    set({ flow: null });
    await save();
  };

  return {
    ...INITIAL,
    loaded: false,
    flow: null,
    // Starts the pairing animation and returns at once; `connected` turns true when pairing ends
    connect: async () => {
      if (get().flow) return;
      set({ flow: { stage: "pairing" } });
      await wait(PAIRING_MS);
      set({ connected: true });
      await runSync();
    },
    disconnect: async () => {
      set({ connected: false });
      await save();
    },
    setPermission: async (type, allowed) => {
      set({ permissions: { ...get().permissions, [type]: allowed } });
      await save();
    },
    syncNow: async () => {
      if (!get().connected || get().flow) return;
      await runSync();
    },
  };
});

const load = async () => {
  try {
    const info = await FileSystem.getInfoAsync(FILE);
    if (info.exists) {
      const saved = JSON.parse(await FileSystem.readAsStringAsync(FILE)) as Partial<Saved>;
      useDemoWatch.setState({
        connected: saved.connected === true,
        lastSyncAt: saved.lastSyncAt ?? null,
        permissions: { ...INITIAL.permissions, ...saved.permissions },
        history: Array.isArray(saved.history) ? saved.history : [],
      });
    }
  } catch (error) {
    console.warn("[demo] Could not read the Demo Watch:", error);
  } finally {
    useDemoWatch.setState({ loaded: true });
  }
};

load();

// The watch feeds the screens only while Simulated data is on and the watch is paired
export const isDemoWatchActive = () => useDemoMode.getState().enabled && useDemoWatch.getState().connected;

export const useDemoWatchActive = () => {
  const demo = useDemoMode((s) => s.enabled);
  const connected = useDemoWatch((s) => s.connected);
  return demo && connected;
};

// Readers with the same shapes the Fitbit store answers. A data type the patient turned off returns nothing.
export const demoWatchReaders = {
  steps: (start: string, end: string) =>
    useDemoWatch.getState().permissions.steps ? watchSteps(start, end) : { "activities-steps": [] },
  heart: (start: string, end: string) =>
    useDemoWatch.getState().permissions.heart ? watchHeart(start, end) : { "activities-heart": [] },
  sleep: (timeRange: string) =>
    useDemoWatch.getState().permissions.sleep ? watchSleepRange(timeRange) : { sleep: [] },
};
