import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { installIntoProject } from "../lib/install.mjs";
import { mergeHooksJson } from "../lib/merge.mjs";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "agent-kit-update-"));
after(() => fs.rmSync(tmp, { recursive: true, force: true }));

function gitInit(dir) {
  fs.mkdirSync(dir, { recursive: true });
  execFileSync("git", ["init", "--quiet", "--initial-branch=main"], { cwd: dir });
  execFileSync("git", ["config", "user.email", "t@example.com"], { cwd: dir });
  execFileSync("git", ["config", "user.name", "t"], { cwd: dir });
  fs.writeFileSync(path.join(dir, "README.md"), "x\n");
  execFileSync("git", ["add", "."], { cwd: dir });
  execFileSync("git", ["commit", "--quiet", "-m", "init"], { cwd: dir });
}

test("mergeHooksJson сохраняет чужие хуки и добавляет память", () => {
  const existing = {
    version: 1,
    hooks: {
      beforeSubmitPrompt: [{ command: "node custom.mjs" }],
      stop: [{ command: "node stop.mjs" }],
    },
  };
  const template = {
    version: 1,
    hooks: {
      beforeSubmitPrompt: [{ command: "node .cursor/hooks/tdai-memory-context.mjs", timeout: 15 }],
    },
  };
  const merged = mergeHooksJson(existing, template);
  assert.equal(merged.hooks.beforeSubmitPrompt.length, 2);
  assert.ok(merged.hooks.stop);
  assert.equal(merged.hooks.stop[0].command, "node stop.mjs");
});

test("memory-only update обновляет scripts и не трогает AGENTS.md пользователя", async () => {
  const root = path.join(tmp, "mem-only");
  gitInit(root);
  fs.mkdirSync(path.join(root, "scripts/tdai-memory"), { recursive: true });
  fs.writeFileSync(path.join(root, "scripts/tdai-memory.mjs"), "old-cli\n");
  fs.writeFileSync(path.join(root, "scripts/tdai-memory/git-backend.mjs"), "old-backend\n");
  fs.writeFileSync(path.join(root, "AGENTS.md"), "мой кастомный AGENTS\n");
  fs.mkdirSync(path.join(root, ".cursor/hooks"), { recursive: true });
  fs.writeFileSync(
    path.join(root, ".cursor/hooks.json"),
    JSON.stringify({
      version: 1,
      hooks: { beforeSubmitPrompt: [{ command: "node keep-me.mjs" }] },
    }),
  );

  const result = await installIntoProject({
    projectRoot: root,
    targets: ["bionic"],
    memory: { mode: "local", remote: "origin", branch: "tdai-memory" },
    components: { skills: false, memory: true },
    updateOnly: true,
  });

  assert.match(fs.readFileSync(path.join(root, "scripts/tdai-memory/git-backend.mjs"), "utf8"), /trackingRefFor/);
  assert.equal(fs.readFileSync(path.join(root, "AGENTS.md"), "utf8"), "мой кастомный AGENTS\n");
  const hooks = JSON.parse(fs.readFileSync(path.join(root, ".cursor/hooks.json"), "utf8"));
  assert.equal(hooks.hooks.beforeSubmitPrompt.length, 2);
  assert.ok(result.notes.some((n) => /память/i.test(n) || /memory/i.test(n) || /обновл/i.test(n)));
  assert.ok(!fs.existsSync(path.join(root, ".agents/skills/tdd-workflow")));
});
