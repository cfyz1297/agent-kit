#!/usr/bin/env node
/**
 * Cursor stdio MCP for TencentDB Agent Memory.
 *
 * Remote mode (official Memory Core v2 API) when all three are set:
 *   TDAI_MEMORY_ENDPOINT, TDAI_MEMORY_API_KEY, TDAI_MEMORY_SERVICE_ID
 * Otherwise L0–L3 files live in the git branch TDAI_MEMORY_BRANCH (default tdai-memory),
 * or in the directory TDAI_MEMORY_DIR when it is set.
 */

import readline from "node:readline";
import { TOOLS, callTool } from "./tdai-memory/tools.mjs";

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

async function handle(message) {
  if (!message || typeof message !== "object" || message.jsonrpc !== "2.0") return;
  if (message.id === undefined) return;
  const { id, method, params } = message;
  try {
    if (method === "initialize") {
      send({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: params?.protocolVersion || "2024-11-05",
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: "tencentdb-agent-memory", version: "1.1.0" },
        },
      });
      return;
    }
    if (method === "tools/list") {
      send({ jsonrpc: "2.0", id, result: { tools: TOOLS } });
      return;
    }
    if (method === "tools/call") {
      const result = await callTool(params?.name, params?.arguments);
      send({
        jsonrpc: "2.0",
        id,
        result: { content: [{ type: "text", text: JSON.stringify(result, null, 2) }], isError: false },
      });
      return;
    }
    if (method === "ping") {
      send({ jsonrpc: "2.0", id, result: {} });
      return;
    }
    send({ jsonrpc: "2.0", id, error: { code: -32601, message: `Метод не поддерживается: ${method}` } });
  } catch (error) {
    const text = error instanceof Error ? error.message : String(error);
    if (method === "tools/call") {
      send({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text }], isError: true } });
      return;
    }
    send({ jsonrpc: "2.0", id, error: { code: -32000, message: text } });
  }
}

const input = readline.createInterface({ input: process.stdin });
input.on("line", (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  let message;
  try {
    message = JSON.parse(trimmed);
  } catch {
    return;
  }
  void handle(message);
});
