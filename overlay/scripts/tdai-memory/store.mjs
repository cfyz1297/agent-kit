import { randomUUID } from "node:crypto";

export const PERSONA_PATH = "persona.md";
export const RECORDS_PATH = "records/store.jsonl";
export const CONVERSATIONS_PATH = "conversations/store.jsonl";
export const RECORD_TYPES = Object.freeze(["fact", "decision", "preference", "constraint"]);

const EMPTY_PERSONA = "# Профиль\n\nПамять проекта ещё не заполнена.\n";
const SESSION_KEY = "daily-usage";

const SECRET_PATTERNS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\bgh[pousr]_[A-Za-z0-9]{20,}/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}/,
  /\bsk-[A-Za-z0-9_-]{20,}/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bxox[abprs]-[A-Za-z0-9-]{10,}/,
  /x-access-token:[^@\s]+@/,
];

export function isMemoryFile(filePath) {
  return (
    filePath === PERSONA_PATH ||
    /^(records|conversations)\/[^/]+\.jsonl$/.test(filePath) ||
    /^scene_blocks\/[^/]+\.md$/.test(filePath)
  );
}

export function limitOf(args, fallback = 5) {
  const value = Number(args.limit ?? fallback);
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.min(20, Math.trunc(value)));
}

export function matches(text, query) {
  const haystack = String(text || "").toLowerCase();
  const tokens = String(query || "").toLowerCase().split(/\s+/).filter((token) => token.length > 1);
  return tokens.every((token) => haystack.includes(token));
}

function parseJsonl(text) {
  return String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      try {
        return [JSON.parse(line)];
      } catch {
        return [];
      }
    });
}

function jsonlUnder(files, directory) {
  return Object.keys(files)
    .filter((name) => name.startsWith(`${directory}/`) && name.endsWith(".jsonl"))
    .sort()
    .flatMap((name) => parseJsonl(files[name]));
}

function appendLine(files, filePath, record) {
  return `${files[filePath] || ""}${JSON.stringify(record)}\n`;
}

export function validateContent(args) {
  const content = String(args.content || "").trim();
  if (!content) throw new Error("content не может быть пустым");
  if (SECRET_PATTERNS.some((pattern) => pattern.test(content))) {
    throw new Error("Похоже на секрет или токен. Такое в память не записывается.");
  }
  return content;
}

export function readPersona(files) {
  return files[PERSONA_PATH] ?? EMPTY_PERSONA;
}

export function searchMemory(files, args) {
  const query = String(args.query || "");
  const type = args.type ? String(args.type) : "";
  const records = jsonlUnder(files, "records")
    .filter((record) => !type || record.type === type)
    .filter((record) => matches(`${record.content || ""} ${record.type || ""}`, query))
    .map((record) => ({ layer: "L1", id: record.id, type: record.type, content: record.content, created_at: record.created_at }));
  const extra = type
    ? []
    : [
        ...(matches(readPersona(files), query) ? [{ layer: "L3", id: "persona", content: readPersona(files).trim() }] : []),
        ...Object.keys(files)
          .filter((name) => name.startsWith("scene_blocks/") && name.endsWith(".md"))
          .sort()
          .filter((name) => matches(`${name}\n${files[name]}`, query))
          .map((name) => ({ layer: "L2", id: name.slice("scene_blocks/".length), content: files[name].trim() })),
      ];
  return [...records, ...extra].slice(-limitOf(args)).reverse();
}

export function recentRecords(files, limit) {
  return jsonlUnder(files, "records").slice(-limit).reverse();
}

export function sceneNames(files) {
  return Object.keys(files)
    .filter((name) => name.startsWith("scene_blocks/") && name.endsWith(".md"))
    .map((name) => name.slice("scene_blocks/".length))
    .sort();
}

export function searchConversations(files, args) {
  const query = String(args.query || "");
  return jsonlUnder(files, "conversations")
    .filter((record) => matches(record.message_text, query))
    .map((record) => ({ layer: "L0", id: record.id, role: record.role, content: record.message_text, recorded_at: record.recorded_at }))
    .slice(-limitOf(args))
    .reverse();
}

export function prepareSave(args, now = new Date().toISOString()) {
  const content = validateContent(args);
  const type = RECORD_TYPES.includes(args.type) ? args.type : "fact";
  const atom = { id: `mem-${randomUUID()}`, type, content, created_at: now, session_key: SESSION_KEY };
  const message = { id: `msg-${randomUUID()}`, role: "user", message_text: content, recorded_at: now, session_key: SESSION_KEY };
  return {
    atom,
    apply: (files) => ({
      [RECORDS_PATH]: appendLine(files, RECORDS_PATH, atom),
      [CONVERSATIONS_PATH]: appendLine(files, CONVERSATIONS_PATH, message),
    }),
  };
}

export function preparePersonaWrite(args) {
  const content = String(args.content || "");
  if (!content.trim()) throw new Error("content не может быть пустым");
  validateContent({ content });
  const text = content.endsWith("\n") ? content : `${content}\n`;
  return () => ({ [PERSONA_PATH]: text });
}
