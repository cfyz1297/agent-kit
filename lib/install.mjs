import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { applyEcc, cloneEcc, readPinnedEcc, resolveEccCommit, setupCodexPlugin } from "./ecc.mjs";
import { copyDir, copyFile, ensureDir } from "./fs-utils.mjs";
import { buildConfig, readConfig, writeConfig } from "./config.mjs";
import {
  detectInstallation,
  inferMemoryFromProject,
  inferTargetsFromProject,
  resolveComponents,
} from "./detect.mjs";
import { mergeHooksJson, mergePermissionsJson } from "./merge.mjs";
import { OVERLAY, TEMPLATES } from "./paths.mjs";
import { postinstall } from "../overlay/scripts/ecc-postinstall.mjs";
import { renderSkillsIndex } from "../overlay/scripts/skills-index.mjs";

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function writeJson(file, value) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function copyIfMissing(src, dest) {
  if (fs.existsSync(dest)) return false;
  copyFile(src, dest);
  return true;
}

function updateMemoryTemplates(projectRoot, { preserveAgents = true } = {}) {
  const notes = [];

  // Always refresh memory runtime + hook script + memory skills/rules
  copyDir(path.join(OVERLAY, "scripts"), path.join(projectRoot, "scripts"), { overwrite: true });
  copyFile(
    path.join(TEMPLATES, ".cursor/hooks/tdai-memory-context.mjs"),
    path.join(projectRoot, ".cursor/hooks/tdai-memory-context.mjs"),
  );
  copyFile(
    path.join(TEMPLATES, ".cursor/rules/tencentdb-agent-memory.mdc"),
    path.join(projectRoot, ".cursor/rules/tencentdb-agent-memory.mdc"),
  );
  copyFile(
    path.join(TEMPLATES, ".agents/skills/tencentdb-agent-memory/SKILL.md"),
    path.join(projectRoot, ".agents/skills/tencentdb-agent-memory/SKILL.md"),
  );
  copyFile(
    path.join(TEMPLATES, ".cursor/skills/tencentdb-agent-memory/SKILL.md"),
    path.join(projectRoot, ".cursor/skills/tencentdb-agent-memory/SKILL.md"),
  );

  const hooksPath = path.join(projectRoot, ".cursor/hooks.json");
  const tmplHooks = readJson(path.join(TEMPLATES, ".cursor/hooks.json")) || {};
  const existingHooks = readJson(hooksPath);
  writeJson(hooksPath, mergeHooksJson(existingHooks, tmplHooks));

  const permPath = path.join(projectRoot, ".cursor/permissions.json");
  const tmplPerm = readJson(path.join(TEMPLATES, ".cursor/permissions.json")) || {};
  const existingPerm = readJson(permPath);
  writeJson(permPath, mergePermissionsJson(existingPerm, tmplPerm));

  const agentsPath = path.join(projectRoot, "AGENTS.md");
  if (!preserveAgents || !fs.existsSync(agentsPath)) {
    copyFile(path.join(TEMPLATES, "AGENTS.md"), agentsPath);
  } else {
    notes.push("AGENTS.md сохранён (уже был в проекте)");
  }

  const licenseSrc = path.join(path.dirname(OVERLAY), "third_party", "ecc", "LICENSE");
  if (fs.existsSync(licenseSrc)) {
    copyFile(licenseSrc, path.join(projectRoot, "third_party", "ecc", "LICENSE"));
  }

  notes.push("Память: scripts/hooks/rules обновлены");
  return notes;
}

function ensureEccConfigs(projectRoot) {
  for (const name of [
    "ecc-install.json",
    "ecc-install.cursor.json",
    "ecc-install.claude.json",
    "ecc-pruned-skills.json",
  ]) {
    copyIfMissing(path.join(TEMPLATES, name), path.join(projectRoot, name));
  }
  // Always refresh prune list from kit so removed-skills stay in sync with kit policy
  copyFile(path.join(TEMPLATES, "ecc-pruned-skills.json"), path.join(projectRoot, "ecc-pruned-skills.json"));
}

function writeSkillsIndex(projectRoot) {
  const skillsDir = path.join(projectRoot, ".agents", "skills");
  ensureDir(skillsDir);
  fs.writeFileSync(path.join(skillsDir, "INDEX.md"), renderSkillsIndex(skillsDir));
}

function ensureGitRepo(projectRoot) {
  const result = spawnSync("git", ["rev-parse", "--is-inside-work-tree"], {
    cwd: projectRoot,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(`Цель не git-репозиторий: ${projectRoot}`);
  }
}

function memoryAlreadySeeded(projectRoot) {
  const cli = path.join(projectRoot, "scripts", "tdai-memory.mjs");
  if (!fs.existsSync(cli)) return false;
  const result = spawnSync("node", [cli, "read"], {
    cwd: projectRoot,
    encoding: "utf8",
    timeout: 60_000,
  });
  if (result.status !== 0) return false;
  try {
    const json = JSON.parse(result.stdout);
    const content = String(json.content || "");
    return content.length > 0 && !/ещё не заполнена/i.test(content);
  } catch {
    return /Профиль|decision|fact/i.test(result.stdout || "");
  }
}

function seedLocalMemoryBranch(projectRoot) {
  if (memoryAlreadySeeded(projectRoot)) {
    return { created: false, skipped: true, reason: "память уже есть — seed пропущен" };
  }
  const cli = path.join(projectRoot, "scripts", "tdai-memory.mjs");
  if (!fs.existsSync(cli)) return { created: false, skipped: true };
  const save = spawnSync(
    "node",
    [cli, "save", "--type", "fact", "agent-kit: память инициализирована"],
    { cwd: projectRoot, encoding: "utf8" },
  );
  if (save.status !== 0) {
    return { created: false, warning: (save.stderr || save.stdout || "").trim() };
  }
  return { created: true };
}

export async function installIntoProject({
  projectRoot,
  targets,
  memory,
  latest = false,
  updateOnly = false,
  components,
  only = "all",
}) {
  ensureGitRepo(projectRoot);
  const detected = detectInstallation(projectRoot);
  const planned =
    components ||
    resolveComponents(detected, {
      only,
      mode: updateOnly || detected.hasSkills || detected.hasMemory ? "update" : "install",
    });

  const notes = [];
  if (detected.hasSkills || detected.hasMemory) {
    notes.push(
      `Обнаружена установка: skills=${detected.hasSkills} memory=${detected.hasMemory} → обновляю skills=${planned.skills} memory=${planned.memory}`,
    );
  }

  const eccMeta = latest ? resolveEccCommit({ latest: true }) : readPinnedEcc();
  const config = buildConfig({
    targets,
    memory,
    eccCommit: eccMeta.commit,
    eccRepository: eccMeta.repository,
  });
  writeConfig(projectRoot, config);

  if (planned.memory) {
    notes.push(
      ...updateMemoryTemplates(projectRoot, {
        preserveAgents: updateOnly || detected.hasMemory || fs.existsSync(path.join(projectRoot, "AGENTS.md")),
      }),
    );
  }

  let eccRoot;
  try {
    if (planned.skills) {
      ensureEccConfigs(projectRoot);
      const needsEccClone = targets.some((t) => t === "cursor" || t === "claude" || t === "bionic");
      if (needsEccClone) {
        eccRoot = cloneEcc(eccMeta);
        if (targets.includes("cursor") || targets.includes("bionic")) {
          applyEcc({ eccRoot, projectRoot, target: "cursor" });
        }
        if (targets.includes("claude")) {
          applyEcc({ eccRoot, projectRoot, target: "claude" });
        }
        postinstall(projectRoot);
        writeSkillsIndex(projectRoot);
        notes.push(`Скиллы ECC обновлены @ ${eccMeta.commit.slice(0, 8)}`);
      }
      if (targets.includes("codex")) {
        const codex = setupCodexPlugin();
        notes.push(codex.message);
      }
    }

    if (planned.memory && memory.mode === "local") {
      const seeded = seedLocalMemoryBranch(projectRoot);
      if (seeded.reason) notes.push(seeded.reason);
      else if (seeded.warning) notes.push(`Память: ${seeded.warning}`);
      else if (seeded.created) notes.push("Ветка памяти создана/обновлена на remote");
    } else if (planned.memory && memory.mode === "shared") {
      notes.push(`Общая память: ${memory.remote} (ветка ${memory.branch})`);
    }
  } finally {
    if (eccRoot) fs.rmSync(eccRoot, { recursive: true, force: true });
  }

  return { config, notes, updateOnly, components: planned, detected };
}

export function loadInstallPlan(projectRoot, args) {
  const existing = readConfig(projectRoot);
  const detected = detectInstallation(projectRoot);
  const targets = args.targetsExplicit
    ? args.targets
    : existing?.targets || inferTargetsFromProject(projectRoot, args.targets);
  if (!targets?.length) throw new Error("Укажите --targets или сначала выполните setup");

  let memory;
  if (args.memory != null) {
    memory = {
      mode: args.memory === "shared" ? "shared" : "local",
      remote:
        args.memory === "shared"
          ? args.memoryRemote
          : existing?.memory?.remote || "origin",
      branch: args.memoryBranch || existing?.memory?.branch || "tdai-memory",
    };
  } else {
    memory = inferMemoryFromProject(projectRoot, {
      mode: "local",
      remote: "origin",
      branch: "tdai-memory",
    });
  }
  if (memory.mode === "shared" && !memory.remote) {
    throw new Error("В .agent-kit.json нет memory.remote для shared-режима");
  }

  const only = args.only || "all";
  const mode = args.command === "update" || detected.hasSkills || detected.hasMemory ? "update" : "install";
  const components = resolveComponents(detected, { only, mode });

  return { targets, memory, components, detected, only };
}
