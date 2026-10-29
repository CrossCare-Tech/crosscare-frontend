jest.mock("@react-native-async-storage/async-storage", () => ({ setItem: jest.fn(), getItem: jest.fn() }));
jest.mock("@/constants/config", () => ({ CONFIG: { API_BASE_URL: "http://localhost:5000/api", RAG_SERVICE_URL: "" } }));
jest.mock("@/utils/demo/demoMode", () => ({ isDemoMode: () => true, whenDemoModeLoaded: () => Promise.resolve() }));
jest.mock("@/utils/demo/mockDb", () => ({ getDemoDb: jest.fn(), saveDemoDb: jest.fn() }));

import { classify } from "@/utils/demo/installDemoInterceptor";

describe("demo interceptor", () => {
  it("sends the Concierge chat to the simulated RAG service even without a RAG URL", () => {
    expect(classify("/chat/user-1")).toMatchObject({ service: "rag", path: "/chat/user-1" });
  });

  it("still sends API calls to the simulated API and leaves other services alone", () => {
    expect(classify("http://localhost:5000/api/user/1/responses")).toMatchObject({ service: "api", path: "/user/1/responses" });
    expect(classify("https://generativelanguage.googleapis.com/v1beta/x")).toBeNull();
  });
});
