import { createMemory } from "./memory.mjs";

const limitSchema = { type: "integer", minimum: 1, maximum: 20, description: "Сколько результатов вернуть, по умолчанию 5" };

export const TOOLS = [
  {
    name: "tdai_memory_search",
    description: "Ищет структурную память L1 (факты, решения, ограничения). Без удалённого Memory Core также смотрит L2-сцены и L3-профиль.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Текст запроса" },
        limit: limitSchema,
        type: { type: "string", description: "Фильтр типа L1: fact, decision, preference, constraint" },
      },
      required: ["query"],
    },
  },
  {
    name: "tdai_conversation_search",
    description: "Ищет сырые реплики L0.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string", description: "Текст запроса" }, limit: limitSchema },
      required: ["query"],
    },
  },
  {
    name: "tdai_memory_save",
    description: "Сохраняет устойчивый факт. Без удалённого Memory Core пишет L1 и L0 в ветку памяти git и сразу пушит. На удалённом Memory Core отправляет реплику в L0, извлечение L1 делает сервер.",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string", description: "Что запомнить" },
        type: { type: "string", enum: ["fact", "decision", "preference", "constraint"], description: "Тип записи, по умолчанию fact" },
      },
      required: ["content"],
    },
  },
  {
    name: "tdai_core_read",
    description: "Читает профиль L3 (persona).",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "tdai_core_write",
    description: "Перезаписывает профиль L3 (persona).",
    inputSchema: {
      type: "object",
      properties: { content: { type: "string", description: "Полный текст профиля" } },
      required: ["content"],
    },
  },
];

const HANDLERS = {
  tdai_memory_search: "search",
  tdai_conversation_search: "conversationSearch",
  tdai_memory_save: "save",
  tdai_core_read: "coreRead",
  tdai_core_write: "coreWrite",
};

export async function callTool(name, args, env = process.env) {
  const method = HANDLERS[name];
  if (!method) throw new Error(`Неизвестный инструмент: ${name}`);
  const input = args && typeof args === "object" ? args : {};
  return createMemory(env)[method](input);
}
