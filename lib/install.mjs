import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { applyEcc, cloneEcc, readPinnedEcc, resolveEccCommit, setupCodexPlugin } from "./ecc.mjs";
import { copyDir, copyFile, ensureDir } from "./fs-utils.mjs";
import { buildConfig, readConfig, writeConfig } from "./config.mjs";
import { OVERLAY, TEMPLATES } from "./paths.mjs";
import { postinstall } from "../overlay/scripts/ecc-postinstall.mjs";
import { renderSkillsIndex } from "../overlay/scripts/skills-index.mjs";

function copyTemplateTree(projectRoot) {
  const pairs = [
    ["AGENTS.md", "AGENTS.md"],
    ["ecc-install.json", "ecc-install.json"],
    ["ecc-install.cursor.json", "ecc-install.cursor.json"],
    ["ecc-install.claude.json", "ecc-install.claude.json"],
    ["ecc-pruned-skills.json", "ecc-pruned-skills.json"],
    [".cursor/hooks.json", ".cursor/hooks.json"],
    [".cursor/hooks/tdai-memory-context.mjs", ".cursor/hooks/tdai-memory-context.mjs"],
    [".cursor/rules/tencentdb-agent-memory.mdc", ".cursor/rules/tencentdb-agent-memory.mdc"],
    [".cursor/permissions.json", ".cursor/permissions.json"],
    [
      ".agents/skills/tencentdb-agent-memory/SKILL.md",
      ".agents/skills/tencentdb-agent-memory/SKILL.md",
    ],
    [
      ".cursor/skills/tencentdb-agent-memory/SKILL.md",
      ".cursor/skills/tencentdb-agent-memory/SKILL.md",
    ],
  ];
  for (const [from, to] of pairs) {
    copyFile(path.join(TEMPLATES, from), path.join(projectRoot, to));
  }
}

function copyMemoryOverlay(projectRoot) {
  copyDir(path.join(OVERLAY, "scripts"), path.join(projectRoot, "scripts"), { overwrite: true });
  const licenseSrc = path.join(path.dirname(OVERLAY), "third_party", "ecc", "LICENSE");
  if (fs.existsSync(licenseSrc)) {
    copyFile(licenseSrc, path.join(projectRoot, "third_party", "ecc", "LICENSE"));
  }
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

function seedLocalMemoryBranch(projectRoot) {
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
}) {
  ensureGitRepo(projectRoot);
  copyTemplateTree(projectRoot);
  copyMemoryOverlay(projectRoot);

  const eccMeta = latest ? resolveEccCommit({ latest: true }) : readPinnedEcc();
  const config = buildConfig({
    targets,
    memory,
    eccCommit: eccMeta.commit,
    eccRepository: eccMeta.repository,
  });
  writeConfig(projectRoot, config);

  const notes = [];
  const needsEcc = targets.some((t) => t === "cursor" || t === "claude" || t === "bionic");
  let eccRoot;
  try {
    if (needsEcc) {
      eccRoot = cloneEcc(eccMeta);
      if (targets.includes("cursor") || targets.includes("bionic")) {
        applyEcc({ eccRoot, projectRoot, target: "cursor" });
      }
      if (targets.includes("claude")) {
        applyEcc({ eccRoot, projectRoot, target: "claude" });
      }
      postinstall(projectRoot);
      writeSkillsIndex(projectRoot);
    }

    if (targets.includes("codex")) {
      const codex = setupCodexPlugin();
      notes.push(codex.message);
    }

    if (memory.mode === "local") {
      const seeded = seedLocalMemoryBranch(projectRoot);
      if (seeded.warning) notes.push(`Память: ${seeded.warning}`);
      else if (seeded.created) notes.push("Ветка памяти создана/обновлена на remote");
    } else {
      notes.push(`Общая память: ${memory.remote} (ветка ${memory.branch})`);
    }
  } finally {
    if (eccRoot) fs.rmSync(eccRoot, { recursive: true, force: true });
  }

  return { config, notes, updateOnly };
}

export function loadInstallPlan(projectRoot, args) {
  const existing = readConfig(projectRoot);
  const targets = args.targetsExplicit ? args.targets : existing?.targets || args.targets;
  if (!targets?.length) throw new Error("Укажите --targets или сначала выполните setup");
  if (args.memory != null) {
    return {
      targets,
      memory: {
        mode: args.memory === "shared" ? "shared" : "local",
        remote:
          args.memory === "shared"
            ? args.memoryRemote
            : existing?.memory?.remote || "origin",
        branch: args.memoryBranch || existing?.memory?.branch || "tdai-memory",
      },
    };
  }
  const memory = existing?.memory || {
    mode: "local",
    remote: "origin",
    branch: "tdai-memory",
  };
  if (memory.mode === "shared" && !memory.remote) {
    throw new Error("В .agent-kit.json нет memory.remote для shared-режима");
  }
  return { targets, memory };
}
