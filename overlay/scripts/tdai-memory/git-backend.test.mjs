import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { createGitBackend } from "./git-backend.mjs";
import { createLocalMemory } from "./memory.mjs";

const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

let root;
let origin;

function cloneMachine(name) {
  const dir = path.join(root, name);
  git(root, "clone", "--quiet", origin, dir);
  git(dir, "config", "user.name", name);
  git(dir, "config", "user.email", `${name}@example.com`);
  return dir;
}

before(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "tdai-git-"));
  origin = path.join(root, "origin.git");
  git(root, "init", "--quiet", "--bare", "--initial-branch=main", origin);
  const seed = cloneMachine("seed");
  fs.writeFileSync(path.join(seed, "README.md"), "project\n");
  git(seed, "add", ".");
  git(seed, "commit", "--quiet", "-m", "init");
  git(seed, "push", "--quiet", "origin", "main");
});

after(() => fs.rmSync(root, { recursive: true, force: true }));

test("пустая память, пока ветки нет", async () => {
  const memory = createLocalMemory(createGitBackend({ cwd: cloneMachine("empty") }));
  const core = await memory.coreRead();
  assert.equal(core.mode, "git");
  assert.equal(core.commit, null);
  assert.match(core.content, /ещё не заполнена/);
});

test("запись с одной машины видна на другой и не трогает рабочую ветку", async () => {
  const phone = cloneMachine("phone");
  const desktop = cloneMachine("desktop");
  const phoneHead = git(phone, "rev-parse", "HEAD");

  const saved = await createLocalMemory(createGitBackend({ cwd: phone })).save({
    content: "Подсчёт товаров идёт через LEFT JOIN",
    type: "decision",
  });
  assert.match(saved.id, /^mem-/);
  assert.equal(git(phone, "rev-parse", "HEAD"), phoneHead);
  assert.equal(git(phone, "status", "--porcelain"), "");
  assert.equal(git(origin, "rev-parse", "tdai-memory"), saved.commit);

  const found = await createLocalMemory(createGitBackend({ cwd: desktop })).search({ query: "left join", type: "decision" });
  assert.equal(found.items.length, 1);
  assert.equal(found.items[0].id, saved.id);
  assert.equal(git(desktop, "branch", "--show-current"), "main");
});

test("параллельная запись не теряет данные", async () => {
  const first = cloneMachine("first");
  const second = cloneMachine("second");
  const competitor = createLocalMemory(createGitBackend({ cwd: second }));
  let raced = false;
  const backend = createGitBackend({
    cwd: first,
    beforePush: () => {
      if (raced) return;
      raced = true;
      void competitor.save({ content: "Запись со второй машины" });
    },
  });
  await createLocalMemory(backend).save({ content: "Запись с первой машины" });

  const items = (await createLocalMemory(createGitBackend({ cwd: first })).search({ query: "запись машины", limit: 20 })).items;
  const texts = items.map((item) => item.content).sort();
  assert.deepEqual(texts, ["Запись с первой машины", "Запись со второй машины"]);
});

test("профиль перезаписывается и читается", async () => {
  const dir = cloneMachine("persona");
  const memory = createLocalMemory(createGitBackend({ cwd: dir }));
  await memory.coreWrite({ content: "# Профиль\n\nКаталог товаров." });
  assert.equal((await memory.coreRead()).content, "# Профиль\n\nКаталог товаров.\n");
});

test("без сети чтение идёт из последней копии, запись падает явно", async () => {
  const dir = cloneMachine("offline");
  await createLocalMemory(createGitBackend({ cwd: dir })).save({ content: "Факт до отключения сети" });
  git(dir, "remote", "set-url", "origin", path.join(root, "missing.git"));
  const memory = createLocalMemory(createGitBackend({ cwd: dir }));

  const found = await memory.search({ query: "отключения" });
  assert.equal(found.stale, true);
  assert.equal(found.items.length, 1);
  await assert.rejects(memory.save({ content: "Не сохранится" }), /синхронизировать/);
});
