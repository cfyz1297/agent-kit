import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";
import { findProblems, portableState, postinstall, prunedNames, renderDoc } from "./ecc-postinstall.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ecc-postinstall-"));
after(() => fs.rmSync(tmp, { recursive: true, force: true }));

const list = {
  eccRepository: "https://github.com/affaan-m/ECC",
  eccCommit: "0123456789abcdef",
  groups: [{ title: "Узкое", reason: "Причина.", skills: [{ name: "drop-me", module: "media", description: "Does a | thing." }] }],
};

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

test("удаляет узкие навыки из обоих каталогов и чистит состояние", () => {
  const root = path.join(tmp, "project");
  write(path.join(root, "ecc-pruned-skills.json"), JSON.stringify(list));
  write(path.join(root, ".cursor/skills/drop-me/SKILL.md"), "x");
  write(path.join(root, ".cursor/.agents/skills/drop-me/SKILL.md"), "x");
  write(path.join(root, ".agents/skills/drop-me/SKILL.md"), "x");
  write(path.join(root, ".cursor/skills/keep-me/SKILL.md"), "полный");
  write(path.join(root, ".agents/skills/already/SKILL.md"), "не затирать");
  const abs = (relative) => path.join(root, relative);
  write(
    abs(".cursor/ecc-install-state.json"),
    JSON.stringify({
      target: { id: "cursor-project", root: abs(".cursor"), installStatePath: abs(".cursor/ecc-install-state.json") },
      operations: [
        { sourcePath: "/tmp/ecc/skills/drop-me/SKILL.md", destinationPath: abs(".cursor/skills/drop-me/SKILL.md") },
        { sourcePath: "/tmp/ecc/skills/keep-me/SKILL.md", destinationPath: abs(".cursor/skills/keep-me/SKILL.md") },
        { destinationPath: abs(".cursor/skills/drop-me-not/SKILL.md") },
      ],
    }),
  );
  assert.ok(findProblems(root).length >= 3);

  const removed = postinstall(root);
  assert.deepEqual(
    removed.sort(),
    [path.join(".agents/skills/drop-me"), path.join(".cursor/.agents/skills/drop-me"), path.join(".cursor/skills/drop-me")].sort(),
  );
  assert.equal(fs.readFileSync(abs(".cursor/skills/keep-me/SKILL.md"), "utf8"), "полный");
  assert.equal(fs.readFileSync(abs(".agents/skills/keep-me/SKILL.md"), "utf8"), "полный");
  assert.equal(fs.readFileSync(abs(".agents/skills/already/SKILL.md"), "utf8"), "не затирать");
  assert.equal(fs.existsSync(abs(".agents/skills/drop-me")), false);

  const state = JSON.parse(fs.readFileSync(abs(".cursor/ecc-install-state.json"), "utf8"));
  assert.deepEqual(state.target, { id: "cursor-project", root: ".cursor", installStatePath: ".cursor/ecc-install-state.json" });
  assert.deepEqual(state.operations, [
    { destinationPath: ".cursor/skills/keep-me/SKILL.md" },
    { destinationPath: ".cursor/skills/drop-me-not/SKILL.md" },
  ]);
  assert.deepEqual(findProblems(root), []);
  assert.deepEqual(postinstall(root), []);
});

test("документ содержит ссылку на навык на закреплённом коммите", () => {
  const doc = renderDoc(list);
  assert.match(doc, /\[`drop-me`\]\(https:\/\/github\.com\/affaan-m\/ECC\/tree\/0123456789abcdef\/skills\/drop-me\)/);
  assert.match(doc, /Does a \\\| thing\./);
  assert.deepEqual(prunedNames(list), ["drop-me"]);
});

test("portableState не трогает чужие состояния без операций", () => {
  const state = portableState({ target: { root: "/x/.cursor" } }, "/x", []);
  assert.deepEqual(state, { target: { root: ".cursor", installStatePath: ".cursor/ecc-install-state.json" }, operations: [] });
});

test("репозиторий: узкие навыки убраны, состояние переносимое, документ актуален", () => {
  assert.deepEqual(findProblems(repoRoot), []);
});
