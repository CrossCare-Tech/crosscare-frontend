import { toLocalDay } from "@/components/vitals/MetricUI";
import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { useSelector } from "react-redux";
import { CONFIG } from "@/constants/config";
import { useDemoMode } from "@/utils/demo/demoMode";
import { serverToday, withTodayReadings } from "@/utils/todayReadings";
import { useUnitStore } from "@/zustandStore/unitStore";
import {
  buildFeeling,
  buildMedications,
  buildVitals,
  Feeling,
  MedicationRow,
  SUMMARY_DAYS,
  VitalRow,
} from "@/components/pregnancy-summary/model";

// `unavailable`: this section has no real data source yet (the feeling summary is Demo only)
export type Section<T> = { state: "loading" | "ready" | "error" | "unavailable"; data: T | null };
const loading = { state: "loading", data: null } as const;

// Reads the patient's own records. Sample data only appears through demo mode, never as a fallback.
export const usePregnancySummary = () => {
  const userId = useSelector((state: any) => state.user.user_id);
  const token = useSelector((state: any) => state.user.token);
  const demo = useDemoMode((state) => state.enabled);
  const weightUnit = useUnitStore((state) => state.weightUnit);
  const [patient, setPatient] = useState<{ name: string; week: number } | null>(null);
  const [vitals, setVitals] = useState<Section<VitalRow[]>>(loading);
  const [medications, setMedications] = useState<Section<MedicationRow[]>>(loading);
  const [feeling, setFeeling] = useState<Section<Feeling>>(loading);
  const [attempt, setAttempt] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = async <T,>(set: (section: Section<T>) => void, read: () => Promise<T>) => {
        set(loading);
        try {
          const data = await read();
          if (active) set({ state: "ready", data });
        } catch (error) {
          console.warn("Error loading the pregnancy summary:", error);
          if (active) set({ state: "error", data: null });
        }
      };
      const get = async (path: string) => {
        const response = await fetch(`${CONFIG.API_BASE_URL}${path}`, {
          headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        if (!response.ok) throw new Error(`${path} answered ${response.status}`);
        return response.json();
      };

      get(`/user/${userId}/profile`)
        .then((profile) => active && setPatient({ name: profile.name || "", week: profile.week || 0 }))
        .catch((error) => console.warn("Error loading the profile:", error));
      load(setVitals, async () => {
        // Today's blood pressure and glucose come from the status routes (see utils/todayReadings.ts)
        const optional = (path: string) => get(path).catch(() => null);
        const [history, bpStatus, glucoseStatus] = await Promise.all([
          get(`/user/activity/${userId}`),
          optional(`/user/activity/${userId}/bpstatus`),
          optional(`/user/activity/${userId}/glucosestatus`),
        ]);
        const activities = withTodayReadings(history.activities || [], bpStatus, glucoseStatus, serverToday());
        return buildVitals(activities, new Date(), weightUnit);
      });
      load(setMedications, async () => buildMedications((await get(`/user/activity/${userId}/getMedication`)).data || []));
      // Mood and symptoms are real records on the backend. The topics the guide noted down have no backend, so none are listed.
      load(setFeeling, async () => {
        const [mood, symptoms] = await Promise.all([
          get(`/user/activity/${userId}/mood?days=${SUMMARY_DAYS}`),
          get(`/user/metrics/${userId}/symptoms?days=${SUMMARY_DAYS}`),
        ]);
        // Mood days are the server's UTC days: bring them to the patient's day, or an evening entry would look like tomorrow
        const moods = (mood.moodHistory || []).map((entry: { date: string }) => ({ ...entry, date: toLocalDay(entry.date) }));
        return buildFeeling(moods, symptoms.symptoms || [], []);
      });

      return () => {
        active = false;
      };
    }, [userId, token, demo, attempt, weightUnit])
  );

  return { patient, vitals, medications, feeling, demo, retry: () => setAttempt((value) => value + 1) };
};
