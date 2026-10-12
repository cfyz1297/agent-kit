import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { renderSkillsIndex } from "./skills-index.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("навык Bionic лежит в репозитории и не ссылается на конкретный компьютер", () => {
  const skill = fs.readFileSync(path.join(projectRoot, ".agents", "skills", "tencentdb-agent-memory", "SKILL.md"), "utf8");
  const hook = fs.readFileSync(path.join(projectRoot, "scripts", "tdai-memory", "hook.mjs"), "utf8");
  assert.ok(fs.existsSync(path.join(projectRoot, ".agents", "skills", "tdd-workflow", "SKILL.md")));
  const agents = fs.readFileSync(path.join(projectRoot, "AGENTS.md"), "utf8");
  const skillsDir = path.join(projectRoot, ".agents", "skills");
  const index = fs.readFileSync(path.join(skillsDir, "INDEX.md"), "utf8");
  assert.equal(index, renderSkillsIndex(skillsDir));
  assert.match(index, /`tdd-workflow` — /);
  assert.match(agents, /node scripts\/tdai-memory\.mjs context/);
  assert.match(agents, /tdd-workflow/);
  assert.doesNotMatch(agents, /[A-Za-z]:\\/);
  assert.match(skill, /INDEX\.md/);
  assert.match(skill, /node scripts\/tdai-memory\.mjs context/);
  assert.match(skill, /node scripts\/tdai-memory\.mjs search/);
  assert.match(skill, /node scripts\/tdai-memory\.mjs save --type/);
  assert.doesNotMatch(skill, /\.lmstudio/);
  assert.doesNotMatch(skill, /[A-Za-z]:\\/);
  assert.doesNotMatch(hook, /installBionicSkill|\.lmstudio/);
  assert.equal(fs.existsSync(path.join(projectRoot, "scripts", "bionic-memory.mjs")), false);
});
