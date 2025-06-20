import { TFunction } from 'i18next'
import { getQuestionnaireDomainsWithTranslation, QuestionnaireDomain, QuestionnaireQuestion } from '../constants/questionaireData'

/**
 * Utility functions for questionnaire translations
 */

/**
 * Get all translated questionnaire domains
 */
export const getTranslatedQuestionnaireDomains = (t: TFunction): QuestionnaireDomain[] => {
  return getQuestionnaireDomainsWithTranslation(t)
}

/**
 * Get a specific translated domain by ID
 */
export const getTranslatedDomain = (t: TFunction, domainId: string): QuestionnaireDomain | undefined => {
  const domains = getQuestionnaireDomainsWithTranslation(t)
  return domains.find(domain => domain.id === domainId)
}

/**
 * Get a specific translated question by domain and question ID
 */
export const getTranslatedQuestion = (t: TFunction, domainId: string, questionId: string): QuestionnaireQuestion | undefined => {
  const domain = getTranslatedDomain(t, domainId)
  if (!domain) return undefined
  
  return domain.questions.find(question => question.id === questionId)
}

/**
 * Get translated domain title
 */
export const getTranslatedDomainTitle = (t: TFunction, domainNumber: number): string => {
  return t(`questionnaire.domains.domain${domainNumber}.title`)
}

/**
 * Get translated domain description
 */
export const getTranslatedDomainDescription = (t: TFunction, domainNumber: number): string => {
  return t(`questionnaire.domains.domain${domainNumber}.description`)
}

/**
 * Get translated question text
 */
export const getTranslatedQuestionText = (t: TFunction, questionId: string): string => {
  return t(`questionnaire.questions.${questionId}`)
}

/**
 * Get translated option text
 */
export const getTranslatedOptionText = (t: TFunction, optionKey: string): string => {
  return t(`questionnaire.options.${optionKey}`)
}

/**
 * Helper to get common options in current language
 */
export const getCommonOptions = (t: TFunction) => ({
  yes: t('questionnaire.options.yes'),
  no: t('questionnaire.options.no'),
  house: t('questionnaire.options.house'),
  apartment: t('questionnaire.options.apartment'),
  hourly: t('questionnaire.options.hourly'),
  salary: t('questionnaire.options.salary')
})

/**
 * Check if a questionnaire has translations available
 */
export const hasQuestionnaireTranslations = (language: string): boolean => {
  const supportedLanguages = ['en', 'es', 'pt', 'ht']
  return supportedLanguages.includes(language)
}

export default {
  getTranslatedQuestionnaireDomains,
  getTranslatedDomain,
  getTranslatedQuestion,
  getTranslatedDomainTitle,
  getTranslatedDomainDescription,
  getTranslatedQuestionText,
  getTranslatedOptionText,
  getCommonOptions,
  hasQuestionnaireTranslations
} 