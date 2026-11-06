import AsyncStorage from "@react-native-async-storage/async-storage";

// The chat keeps one running thread in "chatHistory" (see app/patient/askdoula.tsx). Starting a new conversation
// moves that thread to this archive and leaves the chat empty. The questionnaire state is not touched.
const CURRENT_KEY = "chatHistory";
const BACKUP_KEY = "chatHistory_backup";
const ARCHIVE_KEY = "concierge.threads";
const MAX_ARCHIVED = 50;

type StoredMessage = {
  id: string;
  isUser: boolean;
  timestamp: string; // ISO date
  type: "text" | "audio";
  content: string;
  isEducational?: boolean;
};

export type Thread = {
  id: string;
  title: string;
  summary: string;
  updatedAt: string; // ISO date of the last message
  messages: StoredMessage[];
};

export const CURRENT_THREAD_ID = "current";

const readJson = async <T>(key: string): Promise<T | null> => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

const clip = (text: string, max: number) => {
  const flat = text.replace(/[*_#`>]/g, "").replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
};

// A thread needs something the user said; a lone greeting is not worth keeping.
const toThread = (id: string, messages: StoredMessage[] | null): Thread | null => {
  if (!messages?.length) return null;
  const firstUser = messages.find((m) => m.isUser && m.type === "text" && m.content.trim());
  if (!firstUser) return null;
  const lastReply = [...messages].reverse().find((m) => !m.isUser && m.type === "text" && m.content.trim());
  return {
    id,
    title: clip(firstUser.content, 48),
    summary: lastReply ? clip(lastReply.content, 80) : "",
    updatedAt: messages[messages.length - 1].timestamp,
    messages,
  };
};

export const loadArchivedThreads = async (): Promise<Thread[]> => (await readJson<Thread[]>(ARCHIVE_KEY)) ?? [];

export const loadCurrentThread = async (): Promise<Thread | null> =>
  toThread(CURRENT_THREAD_ID, await readJson<StoredMessage[]>(CURRENT_KEY));

export const archiveCurrentThread = async () => {
  const thread = toThread(`t_${Date.now()}`, await readJson<StoredMessage[]>(CURRENT_KEY));
  try {
    if (thread) {
      const archived = await loadArchivedThreads();
      await AsyncStorage.setItem(ARCHIVE_KEY, JSON.stringify([thread, ...archived].slice(0, MAX_ARCHIVED)));
    }
    await AsyncStorage.multiRemove([CURRENT_KEY, BACKUP_KEY]);
  } catch {
    // The chat still opens; worst case the old thread stays as the current one.
  }
};

// Makes an archived thread the running one. The thread that was running is archived first.
export const restoreThread = async (id: string) => {
  const target = (await loadArchivedThreads()).find((t) => t.id === id);
  if (!target) return;
  await archiveCurrentThread();
  try {
    const rest = (await loadArchivedThreads()).filter((t) => t.id !== id);
    await AsyncStorage.setItem(ARCHIVE_KEY, JSON.stringify(rest));
    await AsyncStorage.setItem(CURRENT_KEY, JSON.stringify(target.messages));
  } catch {
    // Opening the chat shows whatever is current.
  }
};
