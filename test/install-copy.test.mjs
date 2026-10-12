import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { copyDir, copyFile } from "../lib/fs-utils.mjs";
import { OVERLAY, TEMPLATES } from "../lib/paths.mjs";
import { buildConfig, writeConfig } from "../lib/config.mjs";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "agent-kit-copy-"));
after(() => fs.rmSync(tmp, { recursive: true, force: true }));

test("копирует overlays памяти и шаблоны без ECC", () => {
  const project = path.join(tmp, "proj");
  fs.mkdirSync(project);
  execFileSync("git", ["init", "--quiet", "--initial-branch=main"], { cwd: project });
  execFileSync("git", ["config", "user.email", "t@example.com"], { cwd: project });
  execFileSync("git", ["config", "user.name", "t"], { cwd: project });
  fs.writeFileSync(path.join(project, "README.md"), "x\n");
  execFileSync("git", ["add", "."], { cwd: project });
  execFileSync("git", ["commit", "--quiet", "-m", "init"], { cwd: project });

  copyDir(path.join(OVERLAY, "scripts"), path.join(project, "scripts"), { overwrite: true });
  copyFile(path.join(TEMPLATES, "AGENTS.md"), path.join(project, "AGENTS.md"));
  copyFile(
    path.join(TEMPLATES, ".agents/skills/tencentdb-agent-memory/SKILL.md"),
    path.join(project, ".agents/skills/tencentdb-agent-memory/SKILL.md"),
  );
  writeConfig(
    project,
    buildConfig({
      targets: ["bionic"],
      memory: { mode: "local", remote: "origin", branch: "tdai-memory" },
      eccCommit: "deadbeef",
      eccRepository: "https://github.com/affaan-m/ECC",
    }),
  );

  assert.ok(fs.existsSync(path.join(project, "scripts/tdai-memory.mjs")));
  assert.ok(fs.existsSync(path.join(project, "scripts/tdai-memory/git-backend.mjs")));
  assert.ok(fs.existsSync(path.join(project, "AGENTS.md")));
  assert.ok(fs.existsSync(path.join(project, ".agent-kit.json")));
  assert.match(
    fs.readFileSync(path.join(project, "scripts/tdai-memory/git-backend.mjs"), "utf8"),
    /trackingRefFor/,
  );
});
