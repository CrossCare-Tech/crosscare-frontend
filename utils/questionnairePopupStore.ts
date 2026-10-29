import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { CONFIG } from "@/constants/config";
import { QuestionnaireDomain } from "@/constants/questionaireData";
import { isInfoStep } from "@/utils/questionnairePopup";

// What the pop-up questionnaire remembers on the phone between sessions. The answers themselves
// are also sent to the backend (`POST /user/:id/domain`), which is what the AI reads as context.

export type PopupAnswer = { response: string; flag?: string };

export type PopupDomainState = {
  answers: Record<string, PopupAnswer>; // by question id
  path: string[]; // question ids, in the order they were shown
  completed: boolean;
};

export type PopupState = Record<string, PopupDomainState>; // by domain id

const key = (userId: string) => `questionnaire_popup_${userId}`;

export const emptyDomainState = (): PopupDomainState => ({ answers: {}, path: [], completed: false });

export const loadPopupState = async (userId: string): Promise<PopupState> => {
  try {
    const raw = await AsyncStorage.getItem(key(userId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const savePopupState = async (userId: string, state: PopupState) => {
  try {
    await AsyncStorage.setItem(key(userId), JSON.stringify(state));
  } catch (error) {
    console.warn("[questionnaire] Could not save the pop-up state:", error);
  }
};

// Sends the answers of one domain. The backend updates an answer that already exists, so sending
// the whole domain again after "Review my answers" is safe.
export const submitDomainAnswers = async (
  userId: string,
  domain: QuestionnaireDomain,
  state: PopupDomainState
) => {
  const timestamp = new Date().toISOString();
  const body = domain.questions
    .filter((q) => !isInfoStep(q) && state.answers[q.id]?.response)
    .map((q) => ({
      domainId: domain.id,
      questionId: q.id,
      response: state.answers[q.id].response,
      flag: state.answers[q.id].flag ?? q.flag ?? "",
      timestamp,
    }));
  if (!body.length) return;
  await axios.post(`${CONFIG.API_BASE_URL}/user/${userId}/domain`, body, {
    headers: { "Content-Type": "application/json" },
  });
};
