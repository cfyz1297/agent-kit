import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { isMemoryFile } from "./store.mjs";

const MAX_ATTEMPTS = 5;
const FALLBACK_IDENTITY = {
  GIT_AUTHOR_NAME: "tdai-memory",
  GIT_AUTHOR_EMAIL: "tdai-memory@users.noreply.github.com",
  GIT_COMMITTER_NAME: "tdai-memory",
  GIT_COMMITTER_EMAIL: "tdai-memory@users.noreply.github.com",
};

class GitError extends Error {
  constructor(args, result) {
    const stderr = String(result.stderr || result.error?.message || "").trim();
    super(`git ${args[0]}: ${stderr || `код ${result.status}`}`);
    this.stderr = stderr;
  }
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/** Named remotes keep refs/remotes/<name>/…; URLs/paths use a fixed local tracking ref. */
export function trackingRefFor(remote, branch) {
  if (/^[A-Za-z0-9_-]+$/.test(remote)) return `refs/remotes/${remote}/${branch}`;
  return `refs/tdai-memory-remote/${branch}`;
}

export function createGitBackend({ cwd, remote = "origin", branch = "tdai-memory", networkTimeoutMs = 30_000, beforePush } = {}) {
  const trackingRef = trackingRefFor(remote, branch);

  function git(args, { input, env, timeout } = {}) {
    const result = spawnSync("git", args, {
      cwd,
      input,
      encoding: "utf8",
      timeout,
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0", GCM_INTERACTIVE: "never", ...env },
    });
    if (result.status !== 0) throw new GitError(args, result);
    return result.stdout;
  }

  function resolveRef(ref) {
    try {
      return git(["rev-parse", "--verify", "--quiet", `${ref}^{commit}`]).trim();
    } catch {
      return "";
    }
  }

  function fetchBranch() {
    try {
      git(["fetch", "--quiet", "--no-tags", remote, `+refs/heads/${branch}:${trackingRef}`], { timeout: networkTimeoutMs });
      return { ok: true };
    } catch (error) {
      if (/couldn't find remote ref/i.test(error.stderr || "")) {
        git(["update-ref", "-d", trackingRef]);
        return { ok: true };
      }
      return { ok: false, error };
    }
  }

  function readTree(commit) {
    if (!commit) return {};
    const names = git(["ls-tree", "-r", "-z", "--name-only", commit]).split("\0").filter(isMemoryFile);
    return Object.fromEntries(names.map((name) => [name, git(["cat-file", "blob", `${commit}:${name}`])]));
  }

  function identityEnv() {
    try {
      git(["config", "user.email"]);
      return {};
    } catch {
      return FALLBACK_IDENTITY;
    }
  }

  function commitChanges(parent, changes, message) {
    const indexDir = fs.mkdtempSync(path.join(os.tmpdir(), "tdai-memory-index-"));
    const env = { GIT_INDEX_FILE: path.join(indexDir, "index") };
    try {
      git(parent ? ["read-tree", parent] : ["read-tree", "--empty"], { env });
      for (const [name, content] of Object.entries(changes)) {
        const blob = git(["hash-object", "-w", "--stdin"], { input: content }).trim();
        git(["update-index", "--add", "--cacheinfo", `100644,${blob},${name}`], { env });
      }
      const tree = git(["write-tree"], { env }).trim();
      const parentArgs = parent ? ["-p", parent] : [];
      return git(["commit-tree", tree, ...parentArgs, "-m", message], { env: identityEnv() }).trim();
    } finally {
      fs.rmSync(indexDir, { recursive: true, force: true });
    }
  }

  function push(commit) {
    try {
      git(["push", "--quiet", "--no-verify", remote, `${commit}:refs/heads/${branch}`], { timeout: networkTimeoutMs });
      return true;
    } catch (error) {
      if (/rejected|non-fast-forward|fetch first|stale info/i.test(error.stderr || "")) return false;
      throw error;
    }
  }

  return {
    load() {
      const fetched = fetchBranch();
      const head = resolveRef(trackingRef);
      if (!fetched.ok && !head) {
        throw new Error(`Не удалось получить ветку памяти ${remote}/${branch}: ${fetched.error.message}`);
      }
      const info = { backend: "git", branch: `${remote}/${branch}`, commit: head || null };
      return { files: readTree(head), info: fetched.ok ? info : { ...info, stale: true, warning: fetched.error.message } };
    },

    update(apply, message = "memory: update") {
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
        const fetched = fetchBranch();
        if (!fetched.ok) throw new Error(`Не удалось синхронизировать память перед записью: ${fetched.error.message}`);
        const parent = resolveRef(trackingRef);
        const commit = commitChanges(parent, apply(readTree(parent)), message);
        beforePush?.(attempt);
        if (push(commit)) {
          git(["update-ref", trackingRef, commit]);
          return { backend: "git", branch: `${remote}/${branch}`, commit };
        }
        sleep(200 * attempt + Math.floor(Math.random() * 200));
      }
      throw new Error(`Ветка памяти ${remote}/${branch} меняется параллельно, запись не прошла за ${MAX_ATTEMPTS} попыток`);
    },
  };
}
