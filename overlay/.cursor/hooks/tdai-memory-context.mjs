#!/usr/bin/env node
// Cursor treats invalid JSON as a failure, so always print a valid object and exit 0.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseHookInput, runHook } from "../../scripts/tdai-memory/hook.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const env = { TDAI_MEMORY_NETWORK_TIMEOUT_MS: "5000", ...process.env };

let stdin = "";
try {
  stdin = fs.readFileSync(0, "utf8");
} catch {
  stdin = "";
}

const output = await runHook(parseHookInput(stdin), { env, projectRoot });
process.stderr.write(output.additional_context ? "tdai-memory: память добавлена в контекст\n" : "tdai-memory: память уже в этом чате\n");
process.stdout.write(`${JSON.stringify(output)}\n`);
