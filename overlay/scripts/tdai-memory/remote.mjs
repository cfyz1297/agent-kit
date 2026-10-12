import { limitOf, validateContent } from "./store.mjs";

export function remoteConfig(env = process.env) {
  const endpoint = env.TDAI_MEMORY_ENDPOINT?.trim() || "";
  const apiKey = env.TDAI_MEMORY_API_KEY?.trim() || "";
  const serviceId = env.TDAI_MEMORY_SERVICE_ID?.trim() || "";
  const present = [endpoint, apiKey, serviceId].filter(Boolean).length;
  if (present === 0) return null;
  if (present !== 3) {
    throw new Error(
      "Для удалённого Memory Core нужны все три переменные: TDAI_MEMORY_ENDPOINT, TDAI_MEMORY_API_KEY, TDAI_MEMORY_SERVICE_ID",
    );
  }
  return { endpoint: endpoint.replace(/\/+$/, ""), apiKey, serviceId };
}

async function remotePost(config, apiPath, body) {
  const response = await fetch(`${config.endpoint}${apiPath}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "x-tdai-service-id": config.serviceId,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let envelope;
  try {
    envelope = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Memory Core вернул не-JSON (HTTP ${response.status})`);
  }
  if (!response.ok) {
    throw new Error(`Memory Core HTTP ${response.status}: ${envelope.message || text}`);
  }
  if (envelope.code !== 0) {
    throw new Error(`Memory Core code=${envelope.code}: ${envelope.message || "ошибка"}`);
  }
  return envelope.data ?? {};
}

export function createRemoteMemory(config) {
  const call = async (apiPath, body) => ({ mode: "remote", ...(await remotePost(config, apiPath, body)) });
  return {
    search: (args) =>
      call("/v2/atomic/search", {
        query: String(args.query || ""),
        limit: limitOf(args),
        ...(args.type ? { type: String(args.type) } : {}),
      }),
    conversationSearch: (args) => call("/v2/conversation/search", { query: String(args.query || ""), limit: limitOf(args) }),
    save: async (args) => {
      const content = validateContent(args);
      const timestamp = new Date().toISOString();
      return call("/v2/conversation/add", {
        session_id: "cursor-daily-usage",
        messages: [
          { role: "user", content, timestamp },
          { role: "assistant", content: "Запомнил.", timestamp },
        ],
      });
    },
    coreRead: () => call("/v2/core/read", {}),
    coreWrite: async (args) => {
      const content = validateContent(args);
      return call("/v2/core/write", { content });
    },
  };
}
