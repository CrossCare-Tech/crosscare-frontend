import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { CONFIG } from "@/constants/config";
import { isDemoMode, whenDemoModeLoaded } from "./demoMode";
import { getDemoDb, saveDemoDb } from "./mockDb";
import { handleMockRequest, MockRequest, MockResponse } from "./mockRoutes";

// While demo mode is on, every call to the CrossCare API or the RAG service is answered on the
// device. Calls to other services (Gemini, OpenAI, Deepgram, Contentful, Open Food Facts) still go out.
// Imported once from app/_layout.tsx, before any screen runs a request.

const LATENCY_MS = 150;

export type DemoLogEntry = { at: string; method: string; path: string; status: number; matched: boolean };
const log: DemoLogEntry[] = [];
export const getDemoLog = () => [...log];

const trimSlash = (value?: string) => (value || "").replace(/\/+$/, "");

const splitUrl = (rest: string) => {
  const [path, search = ""] = rest.split("?");
  const query: Record<string, string> = {};
  for (const pair of search.split("&").filter(Boolean)) {
    const [key, value = ""] = pair.split("=");
    query[decodeURIComponent(key)] = decodeURIComponent(value);
  }
  return { path: path || "/", query };
};

// Which service a URL belongs to, or null when it is a third-party call
export const classify = (url: string): { service: "api" | "rag"; path: string; query: Record<string, string> } | null => {
  const bases: { service: "api" | "rag"; base: string }[] = [
    { service: "api" as const, base: trimSlash(CONFIG.API_BASE_URL) },
    { service: "rag" as const, base: trimSlash(CONFIG.RAG_SERVICE_URL) },
  ]
    .filter((b) => b.base)
    .sort((a, b) => b.base.length - a.base.length);
  for (const { service, base } of bases) {
    if (url.startsWith(base)) return { service, ...splitUrl(url.slice(base.length)) };
  }
  // Without EXPO_PUBLIC_RAG_SERVICE_URL the chat calls a bare "/chat/<userId>"; it is the Concierge either way
  if (!trimSlash(CONFIG.RAG_SERVICE_URL) && /^\/chat\/[^/?]+/.test(url)) return { service: "rag", ...splitUrl(url) };
  // A build without a .env produces "undefined/user/..." for API calls
  if (url.startsWith("undefined/")) return { service: "api", ...splitUrl(url.slice("undefined".length)) };
  return null;
};

const parseBody = (body: any) => {
  if (typeof body !== "string") return body ?? null;
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
};

const answer = async (service: "api" | "rag", req: MockRequest): Promise<MockResponse> => {
  const db = await getDemoDb();
  let response = handleMockRequest(db, service, req);
  const matched = !!response;
  if (!response) {
    // Unknown route: answer with an empty success so the screen keeps working, and list it in Developer
    console.warn(`[demo] No simulated route for ${req.method} ${req.path}`);
    response = { status: 200, body: { success: true, data: [] } };
  }
  saveDemoDb();
  log.unshift({ at: new Date().toISOString(), method: req.method, path: req.path, status: response.status, matched });
  log.length = Math.min(log.length, 40);
  await new Promise((resolve) => setTimeout(resolve, LATENCY_MS));
  return response;
};

// ---------- fetch ----------

const originalFetch = global.fetch;

global.fetch = (async (input: any, init: any = {}) => {
  await whenDemoModeLoaded();
  const url = typeof input === "string" ? input : input?.url || String(input);
  const target = isDemoMode() ? classify(url) : null;
  if (!target) return originalFetch(input, init);

  const { status, body } = await answer(target.service, {
    method: String(init.method || "GET").toUpperCase(),
    path: target.path,
    query: target.query,
    body: parseBody(init.body),
  });
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}) as typeof fetch;

// ---------- axios ----------

axios.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  await whenDemoModeLoaded();
  const target = isDemoMode() ? classify(axios.getUri(config)) : null;
  if (!target) return config;

  config.adapter = async (adapterConfig) => {
    const { status, body } = await answer(target.service, {
      method: String(adapterConfig.method || "get").toUpperCase(),
      path: target.path,
      query: { ...target.query, ...(adapterConfig.params || {}) },
      body: parseBody(adapterConfig.data),
    });
    const response = { data: body, status, statusText: String(status), headers: {}, config: adapterConfig, request: {} };
    const valid = adapterConfig.validateStatus ? adapterConfig.validateStatus(status) : status < 400;
    if (!valid) {
      throw new AxiosError(`Request failed with status code ${status}`, AxiosError.ERR_BAD_RESPONSE, adapterConfig, {}, response as any);
    }
    return response as any;
  };
  return config;
});
