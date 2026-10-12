import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { formatUnavailable, loadSessionContext } from "./context.mjs";

const SEEN_LIMIT = 200;

export function seenStatePath(env, projectRoot) {
  if (env.TDAI_MEMORY_HOOK_STATE?.trim()) return env.TDAI_MEMORY_HOOK_STATE.trim();
  const key = createHash("sha256").update(path.resolve(projectRoot)).digest("hex").slice(0, 16);
  return path.join(os.tmpdir(), `tdai-memory-hook-${key}.json`);
}

function readSeen(file) {
  try {
    const ids = JSON.parse(fs.readFileSync(file, "utf8"));
    return Array.isArray(ids) ? ids.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function writeSeen(file, ids) {
  const temp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(ids), "utf8");
  fs.renameSync(temp, file);
}

async function contextOrReason(loadContext, env) {
  try {
    return await loadContext(env);
  } catch (error) {
    return formatUnavailable(error instanceof Error ? error.message : String(error));
  }
}

export function parseHookInput(text) {
  try {
    const value = JSON.parse(text || "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

// sessionStart context is dropped by the Cursor IDE (race with chat creation), so the memory
// is attached to the first prompt of every conversation instead.
export async function runHook(input, { env = process.env, projectRoot, loadContext = loadSessionContext } = {}) {
  if (input.hook_event_name !== "beforeSubmitPrompt") {
    return { additional_context: await contextOrReason(loadContext, env) };
  }
  const conversationId = typeof input.conversation_id === "string" ? input.conversation_id : "";
  const file = seenStatePath(env, projectRoot);
  const seen = readSeen(file);
  if (conversationId && seen.includes(conversationId)) return { continue: true };
  const additionalContext = await contextOrReason(loadContext, env);
  if (conversationId) {
    try {
      writeSeen(file, [...seen, conversationId].slice(-SEEN_LIMIT));
    } catch {
      // Without the marker the context is attached again next time, which is harmless.
    }
  }
  return { continue: true, additional_context: additionalContext };
}
