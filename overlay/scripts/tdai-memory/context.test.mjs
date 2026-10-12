import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";
import { CONTEXT_HEADING, formatContext, loadSessionContext } from "./context.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const hookPath = path.join(projectRoot, ".cursor/hooks/tdai-memory-context.mjs");
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "tdai-context-"));
const cleanEnv = { TDAI_MEMORY_ENDPOINT: "", TDAI_MEMORY_API_KEY: "", TDAI_MEMORY_SERVICE_ID: "" };

fs.mkdirSync(path.join(dataDir, "records"));
fs.mkdirSync(path.join(dataDir, "scene_blocks"));
fs.writeFileSync(path.join(dataDir, "persona.md"), "# Профиль\n\nКаталог товаров.\n");
fs.writeFileSync(path.join(dataDir, "scene_blocks/catalog.md"), "# Каталог\n");
fs.writeFileSync(
  path.join(dataDir, "records/store.jsonl"),
  [
    { id: "old", type: "fact", content: "Старый факт", created_at: "2026-10-01T00:00:00Z" },
    { id: "new", type: "decision", content: "Новое решение", created_at: "2026-10-11T00:00:00Z" },
  ]
    .map((record) => JSON.stringify(record))
    .join("\n"),
);

after(() => fs.rmSync(dataDir, { recursive: true, force: true }));

const hookState = path.join(dataDir, "seen.json");

function runHook(env, input = { hook_event_name: "beforeSubmitPrompt", conversation_id: `c-${Math.random()}`, prompt: "привет" }) {
  return spawnSync(process.execPath, [hookPath], {
    cwd: projectRoot,
    input: typeof input === "string" ? input : JSON.stringify(input),
    env: { ...process.env, TDAI_MEMORY_HOOK_STATE: hookState, ...env },
    encoding: "utf8",
  });
}

test("контекст содержит профиль, свежие записи первыми и список сцен", async () => {
  const text = await loadSessionContext({ ...cleanEnv, TDAI_MEMORY_DIR: dataDir });
  assert.ok(text.startsWith(CONTEXT_HEADING));
  assert.match(text, /Каталог товаров/);
  assert.ok(text.indexOf("Новое решение") < text.indexOf("Старый факт"));
  assert.match(text, /- \[decision\] Новое решение \(2026-10-11\)/);
  assert.match(text, /- catalog\.md/);
});

test("длинный контекст обрезается, предупреждение показывается", () => {
  const text = formatContext({ source: "тест", persona: "x".repeat(20_000), warning: "нет сети" });
  assert.ok(text.length < 8100);
  assert.match(text, /Внимание: нет сети/);
  assert.match(text, /обрезано/);
});

test("хук добавляет память только к первому сообщению каждого чата", () => {
  const env = { ...cleanEnv, TDAI_MEMORY_DIR: dataDir };
  const first = runHook(env, { hook_event_name: "beforeSubmitPrompt", conversation_id: "chat-1", prompt: "a" });
  assert.equal(first.status, 0, first.stderr);
  const firstOutput = JSON.parse(first.stdout);
  assert.equal(firstOutput.continue, true);
  assert.match(firstOutput.additional_context, /Новое решение/);

  const second = JSON.parse(runHook(env, { hook_event_name: "beforeSubmitPrompt", conversation_id: "chat-1", prompt: "b" }).stdout);
  assert.deepEqual(second, { continue: true });

  const other = JSON.parse(runHook(env, { hook_event_name: "beforeSubmitPrompt", conversation_id: "chat-2", prompt: "c" }).stdout);
  assert.match(other.additional_context, /Новое решение/);
});

test("хук без входных данных или на sessionStart всё равно отдаёт память", () => {
  const env = { ...cleanEnv, TDAI_MEMORY_DIR: dataDir };
  assert.match(JSON.parse(runHook(env, "").stdout).additional_context, /Новое решение/);
  const session = JSON.parse(runHook(env, { hook_event_name: "sessionStart", session_id: "s" }).stdout);
  assert.equal(session.continue, undefined);
  assert.match(session.additional_context, /Новое решение/);
});

test("при ошибке хук не блокирует сообщение и отдаёт причину", () => {
  const result = runHook({ ...cleanEnv, TDAI_MEMORY_DIR: "", TDAI_MEMORY_API_KEY: "только-ключ" });
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.continue, true);
  assert.match(output.additional_context, /загрузить не удалось: .*все три переменные/);
});

test("команда context печатает тот же текст, что хук подмешивает в чат", () => {
  const cliPath = path.join(projectRoot, "scripts/tdai-memory.mjs");
  const result = spawnSync(process.execPath, [cliPath, "context"], {
    cwd: projectRoot,
    env: { ...process.env, ...cleanEnv, TDAI_MEMORY_DIR: dataDir },
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Каталог товаров/);
  assert.match(result.stdout, /Новое решение/);
  assert.equal(result.stdout.trimStart().startsWith("{"), false);
});

test("повреждённый файл отметок не ломает хук", () => {
  fs.writeFileSync(hookState, "{не json");
  const output = JSON.parse(runHook({ ...cleanEnv, TDAI_MEMORY_DIR: dataDir }, { hook_event_name: "beforeSubmitPrompt", conversation_id: "chat-3" }).stdout);
  assert.match(output.additional_context, /Новое решение/);
  assert.deepEqual(JSON.parse(fs.readFileSync(hookState, "utf8")), ["chat-3"]);
});
