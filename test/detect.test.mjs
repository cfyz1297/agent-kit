import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { detectInstallation, resolveComponents } from "../lib/detect.mjs";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "agent-kit-detect-"));
after(() => fs.rmSync(tmp, { recursive: true, force: true }));

function write(file, content = "x\n") {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

test("пустой проект: ничего не установлено", () => {
  const root = path.join(tmp, "empty");
  fs.mkdirSync(root);
  const d = detectInstallation(root);
  assert.equal(d.hasSkills, false);
  assert.equal(d.hasMemory, false);
  assert.equal(d.hasAgentKit, false);
});

test("детект как в daily-usage: skills + memory без .agent-kit.json", () => {
  const root = path.join(tmp, "daily");
  write(path.join(root, "scripts/tdai-memory.mjs"));
  write(path.join(root, "scripts/tdai-memory/git-backend.mjs"));
  write(path.join(root, ".cursor/hooks/tdai-memory-context.mjs"));
  write(path.join(root, ".agents/skills/tdd-workflow/SKILL.md"));
  write(path.join(root, ".cursor/ecc-install-state.json"), "{}");
  const d = detectInstallation(root);
  assert.equal(d.hasMemory, true);
  assert.equal(d.hasSkills, true);
  assert.equal(d.hasAgentKit, false);
});

test("resolveComponents: update обновляет только то, что уже есть", () => {
  assert.deepEqual(
    resolveComponents({ hasSkills: true, hasMemory: true }, { only: "all", mode: "update" }),
    { skills: true, memory: true },
  );
  assert.deepEqual(
    resolveComponents({ hasSkills: true, hasMemory: false }, { only: "all", mode: "update" }),
    { skills: true, memory: false },
  );
  assert.deepEqual(
    resolveComponents({ hasSkills: false, hasMemory: true }, { only: "skills", mode: "update" }),
    { skills: true, memory: false },
  );
  assert.deepEqual(
    resolveComponents({ hasSkills: false, hasMemory: false }, { only: "all", mode: "install" }),
    { skills: true, memory: true },
  );
});
