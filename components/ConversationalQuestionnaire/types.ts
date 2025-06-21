import { EmpathyResponse } from '../../utils/ConversationalSystem/EmpathyResponses/types';
import { QuestionnaireResponse } from '../../constants/questionaireData';
import { ConversationContext } from '../../utils/ConversationalSystem/ConversationalContext/types';
import { TFunction } from 'i18next';

export interface ConversationalQuestionnaireProps {
  userId: string;
  onQuestionReady: (question: string, isEducational?: boolean) => void;
  onQuestionnaireComplete: () => void;
  onResponseSaved: (response: QuestionnaireResponse) => void;
  setIsPaused: (val: boolean) => void,
  openAIApiKey?: string; // For intent classification
  t: TFunction; // Translation function
}

export interface QuestionnaireAction {
  type: 'NEXT_QUESTION' | 'EMPATHETIC_RESPONSE' | 'CLARIFICATION' | 'DOMAIN_TRANSITION' | 'PAUSE' | 'RESUME' | 'COMPLETE';
  payload?: {
    question?: string;
    empathyResponse?: EmpathyResponse;
    clarification?: string;
    domainIndex?: number;
    questionIndex?: number;
  };
}

export interface ConversationalQuestionnaireManager {
  startQuestionnaire: () => void;
  handleUserResponse: (response: string) => Promise<boolean>;
  resumeQuestionnaire: () => Promise<void>;
  isPaused: boolean;
  isActive: boolean;
  isCompleted: boolean;
  pauseQuestionnaire: () => Promise<ConversationContext>;
  isQuestionnaireCompleted: () => Promise<boolean>;
  reloadContextFromStorage: () => Promise<boolean>;
  context: ConversationContext;
}

