#!/usr/bin/env node
import fs from "node:fs";
import { parseArgs } from "node:util";
import { loadSessionContext } from "./tdai-memory/context.mjs";
import { callTool } from "./tdai-memory/tools.mjs";

const USAGE = `Память проекта (TencentDB Agent Memory).

  node scripts/tdai-memory.mjs context                       профиль и последние записи
  node scripts/tdai-memory.mjs read                          профиль L3
  node scripts/tdai-memory.mjs search <запрос> [--type T] [--limit N]
  node scripts/tdai-memory.mjs history <запрос> [--limit N]  реплики L0
  node scripts/tdai-memory.mjs save [--type T] <текст>       T: fact, decision, preference, constraint
  node scripts/tdai-memory.mjs write-profile < profile.md    перезаписать профиль L3`;

const COMMANDS = {
  read: () => ["tdai_core_read", {}],
  search: (text, values) => ["tdai_memory_search", { query: text, type: values.type, limit: values.limit }],
  history: (text, values) => ["tdai_conversation_search", { query: text, limit: values.limit }],
  save: (text, values) => ["tdai_memory_save", { content: text, type: values.type }],
  "write-profile": () => ["tdai_core_write", { content: fs.readFileSync(0, "utf8") }],
};

async function main(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { type: { type: "string" }, limit: { type: "string" }, help: { type: "boolean", short: "h" } },
  });
  const [command, ...rest] = positionals;
  if (values.help || !command) {
    console.log(USAGE);
    return 0;
  }
  if (command === "context") {
    console.log(await loadSessionContext());
    return 0;
  }
  const build = COMMANDS[command];
  if (!build) {
    console.error(`Неизвестная команда: ${command}\n\n${USAGE}`);
    return 2;
  }
  const [tool, args] = build(rest.join(" "), values);
  console.log(JSON.stringify(await callTool(tool, args), null, 2));
  return 0;
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  },
);
