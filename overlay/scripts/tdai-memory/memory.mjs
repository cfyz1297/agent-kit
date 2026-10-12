import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDirBackend } from "./dir-backend.mjs";
import { createGitBackend } from "./git-backend.mjs";
import { createRemoteMemory, remoteConfig } from "./remote.mjs";
import {
  preparePersonaWrite,
  prepareSave,
  readPersona,
  searchConversations,
  searchMemory,
} from "./store.mjs";

const scriptsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function repoRoot(start) {
  const result = spawnSync("git", ["rev-parse", "--show-toplevel"], { cwd: start, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error("Память хранится в ветке git, а проект не в git-репозитории. Задайте TDAI_MEMORY_DIR для локального каталога.");
  }
  return result.stdout.trim();
}

function readAgentKitMemory(cwd) {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(cwd, ".agent-kit.json"), "utf8"));
    return raw.memory || null;
  } catch {
    return null;
  }
}

export function createBackend(env = process.env) {
  if (env.TDAI_MEMORY_DIR?.trim()) return createDirBackend(env.TDAI_MEMORY_DIR.trim());
  const cwd = repoRoot(env.TDAI_MEMORY_REPO?.trim() || scriptsRoot);
  const kit = readAgentKitMemory(cwd);
  const remote = env.TDAI_MEMORY_REMOTE?.trim() || kit?.remote || "origin";
  const branch = env.TDAI_MEMORY_BRANCH?.trim() || kit?.branch || "tdai-memory";
  return createGitBackend({
    cwd,
    remote,
    branch,
    ...(Number(env.TDAI_MEMORY_NETWORK_TIMEOUT_MS) > 0 ? { networkTimeoutMs: Number(env.TDAI_MEMORY_NETWORK_TIMEOUT_MS) } : {}),
  });
}

function describe({ backend, ...rest }) {
  return { mode: backend, ...rest };
}

export function createLocalMemory(backend) {
  return {
    async search(args) {
      const { files, info } = backend.load();
      return { ...describe(info), items: searchMemory(files, args) };
    },
    async conversationSearch(args) {
      const { files, info } = backend.load();
      return { ...describe(info), messages: searchConversations(files, args) };
    },
    async save(args) {
      const { atom, apply } = prepareSave(args);
      const info = backend.update(apply, `memory: ${atom.type} ${atom.id}`);
      return { ...describe(info), id: atom.id };
    },
    async coreRead() {
      const { files, info } = backend.load();
      return { ...describe(info), content: readPersona(files) };
    },
    async coreWrite(args) {
      const info = backend.update(preparePersonaWrite(args), "memory: persona");
      return { ...describe(info), updated_at: new Date().toISOString() };
    },
  };
}

export function createMemory(env = process.env) {
  const remote = remoteConfig(env);
  return remote ? createRemoteMemory(remote) : createLocalMemory(createBackend(env));
}
