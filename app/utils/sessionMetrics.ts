import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/constants/api';
import { AppState } from 'react-native';

const PENDING_KEY = 'pending_session_metrics';
const START_KEY = 'session_start';

async function postMetric(token: string | null, durationMs: number, timestamp: string) {
  if (!token) throw new Error('No auth token');

  const res = await fetch(`${API_URL}/api/metrics/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ duration_ms: durationMs, timestamp }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${txt}`);
  }

  return res.json();
}

async function enqueueMetric(obj: { duration_ms: number; timestamp: string }) {
  try {
    const raw = await AsyncStorage.getItem(PENDING_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    arr.push(obj);
    await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(arr));
  } catch (err) {
    // best-effort: ignore
    console.warn('enqueueMetric error', err);
  }
}

export async function flushPending(token: string | null) {
  try {
    const raw = await AsyncStorage.getItem(PENDING_KEY);
    const arr: Array<{ duration_ms: number; timestamp: string }> = raw ? JSON.parse(raw) : [];
    if (!arr.length) return;

    const remaining: typeof arr = [];
    for (const item of arr) {
      try {
        await postMetric(token, item.duration_ms, item.timestamp);
      } catch (err) {
        remaining.push(item);
      }
    }

    if (remaining.length) {
      await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(remaining));
    } else {
      await AsyncStorage.removeItem(PENDING_KEY);
    }
  } catch (err) {
    console.warn('flushPending error', err);
  }
}

export async function getSessionStart() {
  return await AsyncStorage.getItem(START_KEY);
}

export async function setSessionStart(iso: string) {
  await AsyncStorage.setItem(START_KEY, iso);
}

export async function clearSessionStart() {
  await AsyncStorage.removeItem(START_KEY);
}

export async function endSession(token: string | null, startIso?: string | null, endIso?: string) {
  try {
    const start = startIso || (await getSessionStart());
    if (!start) return;

    const end = endIso || new Date().toISOString();
    const duration = Math.max(0, new Date(end).getTime() - new Date(start).getTime());

    try {
      await postMetric(token, duration, end);
    } catch (err) {
      // if posting fails, enqueue for retry
      await enqueueMetric({ duration_ms: duration, timestamp: end });
    }

    await clearSessionStart();
  } catch (err) {
    console.warn('endSession error', err);
  }
}

// Attach AppState handlers: end session on background/inactive, start on active and flush pending
export function attachAppStateHandlers(
  getToken: () => Promise<string | null>,
  getStart: () => Promise<string | null>,
  clearStart: () => Promise<void>,
  setStart: (iso: string) => Promise<void>
) {
  let currentState = AppState.currentState;

  AppState.addEventListener('change', async (next) => {
    try {
      if (currentState === 'active' && (next === 'background' || next === 'inactive')) {
        const token = await getToken();
        const start = await getStart();
        if (start && token) {
          await endSession(token, start, new Date().toISOString());
          await clearStart();
        }
      }

      if (next === 'active') {
        const token = await getToken();
        const start = await getStart();
        if (token && !start) {
          await setStart(new Date().toISOString());
        }
        if (token) await flushPending(token);
      }
    } catch (err) {
      console.warn('AppState handler error', err);
    }

    currentState = next;
  });
}

export default {
  postMetric,
  enqueueMetric,
  flushPending,
  getSessionStart,
  setSessionStart,
  clearSessionStart,
  endSession,
  attachAppStateHandlers,
};
