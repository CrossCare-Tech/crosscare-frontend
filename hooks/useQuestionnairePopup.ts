import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { QuestionnaireDomain } from "@/constants/questionaireData";
import { estimateTotal } from "@/utils/questionnairePopup";
import {
  PopupDomainState,
  PopupState,
  emptyDomainState,
  loadPopupState,
  savePopupState,
  submitDomainAnswers,
} from "@/utils/questionnairePopupStore";

// State of the intake questionnaire pop-up: which domain is next, how far along it is, and saving.
export function useQuestionnairePopup(userId: string | undefined, domains: QuestionnaireDomain[]) {
  const [state, setState] = useState<PopupState>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    loadPopupState(userId).then((saved) => {
      if (!alive) return;
      setState(saved);
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, [userId]);

  // The first domain that is not finished yet; null once every domain is done
  const domain = domains.find((d) => !state[d.id]?.completed) ?? null;
  const current = domain ? state[domain.id] ?? emptyDomainState() : emptyDomainState();
  const hasStarted = current.path.length > 1 || Object.keys(current.answers).length > 0;
  const percent = domain && current.path.length
    ? Math.round(((current.path.length - 1) / estimateTotal(domain, current.path)) * 100)
    : 0;
  const minutesLeft = domain
    ? Math.max(1, Math.ceil(((estimateTotal(domain, current.path.length ? current.path : [domain.questions[0].id]) - Math.max(current.path.length - 1, 0)) * 0.4)))
    : 0;

  const persist = useCallback(
    async (target: QuestionnaireDomain, next: PopupDomainState) => {
      if (!userId) return;
      const updated = { ...state, [target.id]: next };
      setState(updated);
      await savePopupState(userId, updated);
      // Send the answers every time: "Save & exit" keeps them on the server too, so the guide
      // already knows them in the next message.
      try {
        await submitDomainAnswers(userId, target, next);
      } catch (error) {
        console.warn("[questionnaire] Could not send the answers, they stay on the phone:", error);
      }
      if (domains.every((d) => updated[d.id]?.completed)) {
        await AsyncStorage.setItem(`questionnaire_completed_${userId}`, "true");
      }
    },
    [userId, state, domains]
  );

  return { loaded, domain, current, hasStarted, percent, minutesLeft, persist };
}
