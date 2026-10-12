import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { readConfig } from "./config.mjs";

function ok(name, detail) {
  return { name, ok: true, detail };
}
function fail(name, detail) {
  return { name, ok: false, detail };
}

export function doctor(projectRoot) {
  const checks = [];

  const node = spawnSync("node", ["-v"], { encoding: "utf8" });
  checks.push(
    node.status === 0
      ? ok("node", node.stdout.trim())
      : fail("node", "Node.js 18+ не найден"),
  );

  const git = spawnSync("git", ["--version"], { encoding: "utf8" });
  checks.push(git.status === 0 ? ok("git", git.stdout.trim()) : fail("git", "git не найден"));

  const cfg = readConfig(projectRoot);
  checks.push(cfg ? ok("config", CONFIG_SUMMARY(cfg)) : fail("config", "нет .agent-kit.json — запустите setup"));

  const scripts = path.join(projectRoot, "scripts", "tdai-memory.mjs");
  checks.push(
    fs.existsSync(scripts)
      ? ok("memory-cli", "scripts/tdai-memory.mjs")
      : fail("memory-cli", "нет scripts/tdai-memory.mjs"),
  );

  const hook = path.join(projectRoot, ".cursor", "hooks.json");
  checks.push(
    fs.existsSync(hook) ? ok("cursor-hook", ".cursor/hooks.json") : fail("cursor-hook", "нет хука Cursor"),
  );

  const agents = path.join(projectRoot, "AGENTS.md");
  checks.push(fs.existsSync(agents) ? ok("agents", "AGENTS.md") : fail("agents", "нет AGENTS.md"));

  const skills = path.join(projectRoot, ".agents", "skills");
  const skillCount = fs.existsSync(skills)
    ? fs.readdirSync(skills, { withFileTypes: true }).filter((e) => e.isDirectory()).length
    : 0;
  checks.push(
    skillCount > 0
      ? ok("skills", `${skillCount} каталогов в .agents/skills`)
      : fail("skills", "пустой .agents/skills — запустите install"),
  );

  if (fs.existsSync(scripts)) {
    const ctx = spawnSync("node", [scripts, "context"], {
      cwd: projectRoot,
      encoding: "utf8",
      timeout: 60_000,
    });
    checks.push(
      ctx.status === 0
        ? ok("memory-context", "context OK")
        : fail("memory-context", (ctx.stderr || ctx.stdout || "ошибка context").trim().slice(0, 200)),
    );
  }

  return checks;
}

function CONFIG_SUMMARY(cfg) {
  return `targets=${(cfg.targets || []).join(",")} memory=${cfg.memory?.mode || "?"} ecc=${(cfg.ecc?.commit || "").slice(0, 8)}`;
}
