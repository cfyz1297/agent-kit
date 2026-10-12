import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { createGitBackend, trackingRefFor } from "../overlay/scripts/tdai-memory/git-backend.mjs";
import { createLocalMemory } from "../overlay/scripts/tdai-memory/memory.mjs";

const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

test("trackingRefFor: имя remote vs URL", () => {
  assert.equal(trackingRefFor("origin", "tdai-memory"), "refs/remotes/origin/tdai-memory");
  assert.equal(
    trackingRefFor("https://github.com/cfyz1297/daily-usage.git", "tdai-memory"),
    "refs/tdai-memory-remote/tdai-memory",
  );
});

let root;
let sharedBare;
let project;

before(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "tdai-shared-"));
  sharedBare = path.join(root, "shared.git");
  git(root, "init", "--quiet", "--bare", "--initial-branch=main", sharedBare);
  const seed = path.join(root, "seed");
  git(root, "clone", "--quiet", sharedBare, seed);
  git(seed, "config", "user.name", "seed");
  git(seed, "config", "user.email", "seed@example.com");
  fs.writeFileSync(path.join(seed, "README.md"), "shared\n");
  git(seed, "add", ".");
  git(seed, "commit", "--quiet", "-m", "init");
  git(seed, "push", "--quiet", "origin", "main");

  project = path.join(root, "project");
  fs.mkdirSync(project);
  git(project, "init", "--quiet", "--initial-branch=main");
  git(project, "config", "user.name", "project");
  git(project, "config", "user.email", "project@example.com");
  fs.writeFileSync(path.join(project, "app.txt"), "app\n");
  git(project, "add", ".");
  git(project, "commit", "--quiet", "-m", "init");
});

after(() => fs.rmSync(root, { recursive: true, force: true }));

test("shared remote URL: запись и чтение без origin проекта", async () => {
  const backend = createGitBackend({
    cwd: project,
    remote: sharedBare,
    branch: "tdai-memory",
  });
  const saved = await createLocalMemory(backend).save({
    content: "Общая память через URL remote",
    type: "decision",
  });
  assert.match(saved.id, /^mem-/);
  assert.equal(git(sharedBare, "rev-parse", "tdai-memory"), saved.commit);

  const found = await createLocalMemory(
    createGitBackend({ cwd: project, remote: sharedBare, branch: "tdai-memory" }),
  ).search({ query: "общая память", type: "decision" });
  assert.equal(found.items.length, 1);
  assert.equal(found.items[0].id, saved.id);
});
