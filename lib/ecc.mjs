import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { TEMPLATES } from "./paths.mjs";

function run(command, args, opts = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...opts,
  });
  if (result.status !== 0) {
    const err = (result.stderr || result.stdout || "").trim();
    throw new Error(`${command} ${args.join(" ")}: ${err || `код ${result.status}`}`);
  }
  return result.stdout;
}

export function readPinnedEcc() {
  const list = JSON.parse(fs.readFileSync(path.join(TEMPLATES, "ecc-pruned-skills.json"), "utf8"));
  return {
    repository: list.eccRepository || "https://github.com/affaan-m/ECC",
    commit: list.eccCommit,
  };
}

export function resolveEccCommit({ latest = false } = {}) {
  const pinned = readPinnedEcc();
  if (!latest) return pinned;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "agent-kit-ecc-ref-"));
  try {
    run("git", ["ls-remote", pinned.repository, "HEAD"], { cwd: tmp });
    const out = run("git", ["ls-remote", pinned.repository, "HEAD"]);
    const commit = out.split(/\s+/)[0];
    if (!/^[0-9a-f]{40}$/i.test(commit)) throw new Error("Не удалось получить HEAD ECC");
    return { ...pinned, commit };
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

export function cloneEcc({ repository, commit }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "agent-kit-ecc-"));
  run("git", ["clone", "--quiet", repository, dir]);
  run("git", ["checkout", "--quiet", commit], { cwd: dir });
  run("npm", ["ci", "--omit=dev", "--ignore-scripts"], { cwd: dir, shell: true });
  return dir;
}

export function applyEcc({ eccRoot, projectRoot, target }) {
  const configName =
    target === "claude" ? "ecc-install.claude.json" : "ecc-install.cursor.json";
  const configPath = path.join(projectRoot, configName);
  if (!fs.existsSync(configPath)) {
    throw new Error(`Нет конфига ECC: ${configName}`);
  }
  run(
    "node",
    [path.join(eccRoot, "scripts", "install-apply.js"), "--config", configPath, "--no-hooks"],
    { cwd: projectRoot },
  );
}

export function which(command) {
  const result = spawnSync(command, ["--version"], {
    encoding: "utf8",
    shell: true,
  });
  return result.status === 0;
}

export function setupCodexPlugin() {
  if (!which("codex")) {
    return {
      ok: false,
      message:
        "CLI codex не найден. Установите Codex, затем: codex plugin marketplace add affaan-m/ECC && codex plugin add ecc@ecc",
    };
  }
  try {
    run("codex", ["plugin", "marketplace", "add", "affaan-m/ECC"], { shell: true });
  } catch {
    // marketplace may already exist
  }
  try {
    run("codex", ["plugin", "add", "ecc@ecc"], { shell: true });
    return { ok: true, message: "Codex plugin ecc@ecc установлен" };
  } catch (error) {
    return { ok: false, message: `Codex plugin: ${error.message}` };
  }
}
