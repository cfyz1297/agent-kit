import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(scriptsDir, "tdai-memory-mcp.mjs");
const cliPath = path.join(scriptsDir, "tdai-memory.mjs");
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "tdai-memory-"));
const localEnv = { TDAI_MEMORY_DIR: dataDir, TDAI_MEMORY_ENDPOINT: "", TDAI_MEMORY_API_KEY: "", TDAI_MEMORY_SERVICE_ID: "" };

after(() => fs.rmSync(dataDir, { recursive: true, force: true }));

function start(env) {
  const child = spawn(process.execPath, [serverPath], { stdio: ["pipe", "pipe", "pipe"], env: { ...process.env, ...env } });
  let buffer = "";
  const pending = new Map();
  child.stdout.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    buffer += chunk;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines.filter((value) => value.trim())) {
      const message = JSON.parse(line);
      pending.get(message.id)?.(message);
      pending.delete(message.id);
    }
  });
  let nextId = 1;
  return {
    child,
    request(method, params) {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`таймаут ${method}`)), 5000);
        pending.set(id, (message) => {
          clearTimeout(timer);
          resolve(message);
        });
        child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
      });
    },
  };
}

const callText = async (server, name, args) => {
  const message = await server.request("tools/call", { name, arguments: args });
  assert.equal(message.error, undefined);
  return message.result;
};

test("MCP: инструменты, запись, поиск и профиль", async () => {
  const server = start(localEnv);
  try {
    const initialized = await server.request("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test", version: "0" } });
    assert.equal(initialized.result.serverInfo.name, "tencentdb-agent-memory");

    const listed = await server.request("tools/list", {});
    assert.deepEqual(listed.result.tools.map((tool) => tool.name), [
      "tdai_memory_search",
      "tdai_conversation_search",
      "tdai_memory_save",
      "tdai_core_read",
      "tdai_core_write",
    ]);

    const saved = JSON.parse((await callText(server, "tdai_memory_save", { content: "Пустой архив остаётся в LEFT JOIN с нулём товаров", type: "decision" })).content[0].text);
    assert.equal(saved.mode, "dir");
    assert.match(saved.id, /^mem-/);

    const found = JSON.parse((await callText(server, "tdai_memory_search", { query: "пустой архив", type: "decision" })).content[0].text);
    assert.equal(found.items.length, 1);

    const dialogue = JSON.parse((await callText(server, "tdai_conversation_search", { query: "архив" })).content[0].text);
    assert.equal(dialogue.messages.length, 1);

    await callText(server, "tdai_core_write", { content: "# Профиль\n\nКаталог товаров.\n" });
    const core = JSON.parse((await callText(server, "tdai_core_read", {})).content[0].text);
    assert.match(core.content, /Каталог товаров/);

    assert.equal((await callText(server, "tdai_memory_save", { content: "   " })).isError, true);
    assert.equal((await callText(server, "tdai_unknown", {})).isError, true);
  } finally {
    server.child.kill();
  }
});

test("MCP: неполный набор переменных удалённого режима — ошибка", async () => {
  const server = start({ ...localEnv, TDAI_MEMORY_ENDPOINT: "http://127.0.0.1:9" });
  try {
    const result = await callText(server, "tdai_core_read", {});
    assert.equal(result.isError, true);
    assert.match(result.content[0].text, /все три переменные/);
  } finally {
    server.child.kill();
  }
});

test("CLI: save, search, read и ошибки", () => {
  const run = (args, input) =>
    spawnSync(process.execPath, [cliPath, ...args], { env: { ...process.env, ...localEnv }, input, encoding: "utf8" });

  const saved = run(["save", "--type", "constraint", "Секреты", "в", "память", "не", "писать"]);
  assert.equal(saved.status, 0, saved.stderr);
  assert.equal(JSON.parse(saved.stdout).mode, "dir");

  const found = JSON.parse(run(["search", "секреты", "--type", "constraint"]).stdout);
  assert.equal(found.items[0].content, "Секреты в память не писать");

  assert.equal(run(["write-profile"], "# Профиль CLI\n").status, 0);
  assert.match(JSON.parse(run(["read"]).stdout).content, /Профиль CLI/);
  assert.equal(JSON.parse(run(["history", "секреты"]).stdout).messages.length, 1);

  const empty = run(["save"]);
  assert.equal(empty.status, 1);
  assert.match(empty.stderr, /пустым/);
  assert.equal(run(["oops"]).status, 2);
  assert.match(run([]).stdout, /Память проекта/);
  assert.match(run([]).stdout, /context/);
});
