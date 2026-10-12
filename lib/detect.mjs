import fs from "node:fs";
import path from "node:path";
import { CONFIG_NAME, readConfig } from "./config.mjs";

export function detectInstallation(projectRoot) {
  const hasAgentKit = fs.existsSync(path.join(projectRoot, CONFIG_NAME));
  const hasMemoryCli = fs.existsSync(path.join(projectRoot, "scripts", "tdai-memory.mjs"));
  const hasMemoryBackend = fs.existsSync(
    path.join(projectRoot, "scripts", "tdai-memory", "git-backend.mjs"),
  );
  const hasMemoryHook = fs.existsSync(
    path.join(projectRoot, ".cursor", "hooks", "tdai-memory-context.mjs"),
  );
  const hasMemory =
    hasMemoryCli ||
    hasMemoryBackend ||
    hasMemoryHook ||
    Boolean(readConfig(projectRoot)?.memory);

  const agentsSkills = path.join(projectRoot, ".agents", "skills");
  const cursorSkills = path.join(projectRoot, ".cursor", "skills");
  const hasSkillDirs =
    countSkillDirs(agentsSkills) + countSkillDirs(cursorSkills) > 0;
  const hasEccState = fs.existsSync(path.join(projectRoot, ".cursor", "ecc-install-state.json"));
  const hasSkills = hasSkillDirs || hasEccState || Boolean(readConfig(projectRoot)?.ecc);

  return {
    hasAgentKit,
    hasMemory,
    hasSkills,
    hasMemoryCli,
    hasEccState,
  };
}

function countSkillDirs(dir) {
  if (!fs.existsSync(dir)) return 0;
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(dir, entry.name, "SKILL.md")))
    .length;
}

/**
 * @param {{ hasSkills: boolean, hasMemory: boolean }} detected
 * @param {{ only?: 'all'|'skills'|'memory', mode?: 'install'|'update'|'setup' }} opts
 */
export function resolveComponents(detected, { only = "all", mode = "install" } = {}) {
  if (only === "skills") return { skills: true, memory: false };
  if (only === "memory") return { skills: false, memory: true };

  if (mode === "update" || mode === "setup") {
    if (detected.hasSkills || detected.hasMemory) {
      return {
        skills: Boolean(detected.hasSkills),
        memory: Boolean(detected.hasMemory),
      };
    }
  }

  // Fresh install / setup on empty project: both
  return { skills: true, memory: true };
}

export function inferMemoryFromProject(projectRoot, fallback) {
  const cfg = readConfig(projectRoot);
  if (cfg?.memory) return cfg.memory;
  return (
    fallback || {
      mode: "local",
      remote: "origin",
      branch: "tdai-memory",
    }
  );
}

export function inferTargetsFromProject(projectRoot, fallback) {
  const cfg = readConfig(projectRoot);
  if (cfg?.targets?.length) return cfg.targets;
  const detected = detectInstallation(projectRoot);
  if (!detected.hasSkills && !detected.hasMemory) return fallback;
  const targets = [];
  if (fs.existsSync(path.join(projectRoot, ".cursor"))) targets.push("cursor");
  if (fs.existsSync(path.join(projectRoot, ".claude")) || fs.existsSync(path.join(projectRoot, "CLAUDE.md"))) {
    targets.push("claude");
  }
  if (fs.existsSync(path.join(projectRoot, ".agents", "skills"))) targets.push("bionic");
  if (!targets.length) targets.push("cursor", "bionic");
  return targets;
}
