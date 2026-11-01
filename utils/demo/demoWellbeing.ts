import * as FileSystem from "expo-file-system";
import { create } from "zustand";
import { CycleLog, CycleSymptom, Flow, PrivateLog, addDays, dayKeyOf } from "@/components/wellbeing/model";

// Cycle logs and check-in results for Simulated data mode. The backend has no routes for them yet,
// so the screens are only reachable in demo mode. See docs/demo-mode.md.

export type PhqResult = {
  at: string; // ISO
  kind: "phq2" | "phq9";
  answers: number[];
};

type Saved = {
  cycleLogs: Record<string, CycleLog>;
  privateLogs: Record<string, PrivateLog>;
  phqResult: PhqResult | null;
};

type DemoWellbeingState = Saved & {
  saveCycleLog: (day: string, log: CycleLog) => void;
  savePrivateLog: (day: string, log: PrivateLog) => void;
  savePhqResult: (result: PhqResult) => void;
};

// A file, like the demo flag: logout runs AsyncStorage.clear()
const FILE = `${FileSystem.documentDirectory}demo-wellbeing.json`;

const CYCLE_LENGTHS = [28, 27, 29, 27, 28, 27]; // oldest first
const PERIOD_FLOWS: Flow[] = ["medium", "heavy", "medium", "light", "light"];
const FIRST_DAY_SYMPTOMS: CycleSymptom[] = ["cramps", "fatigue"];

// Six finished cycles and a period that started two days ago, so the log opens on day 3 as in the prototype
const sampleCycleLogs = () => {
  const today = dayKeyOf(new Date());
  const logs: Record<string, CycleLog> = {};
  let start = addDays(today, -2);
  const addPeriod = (first: string) => {
    PERIOD_FLOWS.forEach((flow, index) => {
      const day = addDays(first, index);
      if (day < today) logs[day] = { flow, symptoms: index === 0 ? FIRST_DAY_SYMPTOMS : [] };
    });
  };
  addPeriod(start);
  [...CYCLE_LENGTHS].reverse().forEach((length) => {
    start = addDays(start, -length);
    addPeriod(start);
  });
  return logs;
};

const initial = (): Saved => ({ cycleLogs: sampleCycleLogs(), privateLogs: {}, phqResult: null });

const write = (state: Saved) => {
  const saved: Saved = { cycleLogs: state.cycleLogs, privateLogs: state.privateLogs, phqResult: state.phqResult };
  FileSystem.writeAsStringAsync(FILE, JSON.stringify(saved)).catch((error) =>
    console.warn("[demo] Could not save the wellbeing data:", error)
  );
};

export const useDemoWellbeing = create<DemoWellbeingState>((set, get) => {
  const update = (changes: Partial<Saved>) => {
    set(changes);
    write(get());
  };
  return {
    ...initial(),
    saveCycleLog: (day, log) => update({ cycleLogs: { ...get().cycleLogs, [day]: log } }),
    savePrivateLog: (day, log) => update({ privateLogs: { ...get().privateLogs, [day]: log } }),
    savePhqResult: (result) => update({ phqResult: result }),
  };
});

const load = async () => {
  try {
    const info = await FileSystem.getInfoAsync(FILE);
    if (info.exists) useDemoWellbeing.setState(JSON.parse(await FileSystem.readAsStringAsync(FILE)));
  } catch (error) {
    console.warn("[demo] Could not read the wellbeing data:", error);
  }
};

load();

// Developer > Reset simulated data
export const resetDemoWellbeing = async () => {
  const fresh = initial();
  useDemoWellbeing.setState(fresh);
  write(fresh);
};
