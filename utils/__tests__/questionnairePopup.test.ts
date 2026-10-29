import { QUESTIONNAIRE_DOMAINS } from "@/constants/questionaireData";
import { estimateTotal, isFreeTextStep, isInfoStep, nextQuestionId } from "@/utils/questionnairePopup";

const domain = QUESTIONNAIRE_DOMAINS[0];
const find = (id: string) => domain.questions.find((q) => q.id === id)!;

describe("questionnaire pop-up decision tree", () => {
  it("follows the answer, then the wildcard, then the next question in the list", () => {
    const first = domain.questions[0];
    expect(nextQuestionId(domain, first, first.options![0])).toBe(first.followUp![first.options![0]]);
    expect(nextQuestionId(domain, find("q1-c"), "anything typed")).toBe("q1-2");
  });

  it("follows the default branch when the question is skipped", () => {
    const first = domain.questions[0];
    expect(nextQuestionId(domain, first, null)).toBe(first.followUp![first.options![0]]);
  });

  it("tells information steps from questions the patient types", () => {
    expect(isInfoStep(find("q1-smoke-info"))).toBe(true);
    expect(isFreeTextStep(find("q1-c"))).toBe(true);
    expect(isFreeTextStep(find("q1-smoke"))).toBe(false);
  });

  it("ends every domain: the default path never loops and always terminates", () => {
    QUESTIONNAIRE_DOMAINS.forEach((d) => {
      const total = estimateTotal(d, [d.questions[0].id]);
      expect(total).toBeGreaterThan(0);
      expect(total).toBeLessThanOrEqual(d.questions.length);
    });
  });
});
