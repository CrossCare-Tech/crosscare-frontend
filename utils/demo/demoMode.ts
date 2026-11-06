import { create } from "zustand";

// This version of the app talks to the real backend only. The "Simulated data" switch and the Developer area are no
// longer part of the app, so demo mode is permanently off: nothing (no setting, saved flag or environment variable)
// can turn it on. The sample-data code under utils/demo stays in the repository, dormant, and is never reached.
type DemoModeState = { enabled: boolean };

export const useDemoMode = create<DemoModeState>(() => ({ enabled: false }));

// Screens built as demos have no backend behind them yet (Cycle and mental health, Documents, Activity log, Premium, clinics...).
// They stay out of the app, unless a preview build sets EXPO_PUBLIC_PREVIEW_SCREENS=true to show them for a design review.
export const usePreviewScreens = () => process.env.EXPO_PUBLIC_PREVIEW_SCREENS === "true";

export const whenDemoModeLoaded = () => Promise.resolve();

export const isDemoMode = () => false;
