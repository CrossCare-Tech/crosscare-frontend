import React from "react";
import { act, create } from "react-test-renderer";
import QuestionnairePopup from "@/components/questionnaire/QuestionnairePopup";
import { QUESTIONNAIRE_DOMAINS } from "@/constants/questionaireData";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string, vars?: any) => (vars ? `${key}:${JSON.stringify(vars)}` : key) }),
}));
jest.mock("@/components/ui/ScreenBackground", () => ({ children }: any) => children);
jest.mock("react-native-safe-area-context", () => ({ SafeAreaView: ({ children }: any) => children }));
jest.mock("@expo/vector-icons", () => ({ Feather: () => null, Ionicons: () => null }));

const domain = QUESTIONNAIRE_DOMAINS[0];
const press = (tree: any, label: string) => {
  const node = tree.root.findAll(
    (n: any) => n.props.accessibilityRole === "button" && JSON.stringify(n.props.children).includes(label)
  )[0];
  act(() => node.props.onPress());
};
const texts = (tree: any) => JSON.stringify(tree.toJSON());

describe("QuestionnairePopup", () => {
  it("never advances by itself, walks the tree and ends on the thank-you screen", () => {
    const onFinish = jest.fn();
    const onSaveExit = jest.fn();
    let tree: any;
    act(() => {
      tree = create(
        <QuestionnairePopup
          visible
          domain={domain}
          userName="Maya"
          portrait={0 as any}
          initial={{ answers: {}, path: [], completed: false }}
          onSaveExit={onSaveExit}
          onFinish={onFinish}
          onBackToChat={jest.fn()}
        />
      );
    });
    expect(texts(tree)).toContain(domain.questions[0].text);

    // Next is disabled until an answer is picked
    const next = () => tree.root.findAll((n: any) => n.props.accessibilityRole === "button" && typeof n.props.onPress === "function" && n.props.disabled !== undefined)[0];
    expect(next().props.disabled).toBe(true);

    // Pick an answer: the screen stays on the same question until Next is pressed
    const first = domain.questions[0];
    const radio = tree.root.findAll((n: any) => n.props.accessibilityRole === "radio" && typeof n.props.onPress === "function")[0];
    act(() => radio.props.onPress());
    expect(texts(tree)).toContain(first.text);
    expect(next().props.disabled).toBe(false);

    // Answer every question down the first-option path until the end
    for (let i = 0; i < 40 && !onFinish.mock.calls.length; i++) {
      const options = tree.root.findAll((n: any) => n.props.accessibilityRole === "radio" && typeof n.props.onPress === "function");
      const input = tree.root.findAll((n: any) => n.props.placeholder === "questionnairePopup.typeAnswer")[0];
      if (options.length) act(() => options[0].props.onPress());
      else if (input) act(() => input.props.onChangeText("typed"));
      const btn = tree.root.findAll((n: any) => n.props.accessibilityRole === "button" && typeof n.props.onPress === "function" && n.props.accessibilityState && "disabled" in n.props.accessibilityState)[0];
      act(() => btn.props.onPress());
    }
    expect(onFinish).toHaveBeenCalledTimes(1);
    const result = onFinish.mock.calls[0][0];
    expect(result.completed).toBe(true);
    expect(Object.keys(result.answers).length).toBeGreaterThan(3);
    expect(texts(tree)).toContain("questionnairePopup.thanks");
  });
});
