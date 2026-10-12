import fs from "node:fs";
import path from "node:path";

export const DEFAULT_TARGETS = ["cursor", "claude", "codex", "bionic"];
export const CONFIG_NAME = ".agent-kit.json";

export function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = {
    project: ".",
    memory: undefined,
    memoryRemote: undefined,
    memoryBranch: "tdai-memory",
    targets: undefined,
    only: "all",
    latest: false,
    yes: false,
    help: false,
  };

  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    const next = () => {
      i += 1;
      return rest[i];
    };
    switch (arg) {
      case "--project":
      case "-p":
        options.project = next();
        break;
      case "--memory":
        options.memory = next();
        break;
      case "--memory-remote":
        options.memoryRemote = next();
        break;
      case "--memory-branch":
        options.memoryBranch = next();
        break;
      case "--targets":
        options.targets = next()
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
        break;
      case "--only":
        options.only = next();
        break;
      case "--latest":
        options.latest = true;
        break;
      case "--yes":
      case "-y":
        options.yes = true;
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
      default:
        throw new Error(`Неизвестный аргумент: ${arg}`);
    }
  }

  const targetsExplicit = Array.isArray(options.targets);
  const only = String(options.only || "all").toLowerCase();
  if (!["all", "skills", "memory"].includes(only)) {
    throw new Error(" --only должен быть all, skills или memory");
  }
  return {
    command: command || "help",
    ...options,
    only,
    targets: targetsExplicit ? options.targets : [...DEFAULT_TARGETS],
    targetsExplicit,
  };
}

export function resolveMemoryChoice({ memory, memoryRemote, memoryBranch = "tdai-memory" } = {}) {
  const mode = memory === "shared" ? "shared" : "local";
  if (mode === "shared") {
    if (!memoryRemote?.trim()) {
      throw new Error("Для --memory shared укажите --memory-remote <git-url>");
    }
    return { mode, remote: memoryRemote.trim(), branch: memoryBranch || "tdai-memory" };
  }
  return { mode: "local", remote: "origin", branch: memoryBranch || "tdai-memory" };
}

export function buildConfig({ targets, memory, eccCommit, eccRepository }) {
  return {
    version: 1,
    targets: [...targets],
    memory: {
      mode: memory.mode,
      remote: memory.remote,
      branch: memory.branch,
    },
    ecc: {
      repository: eccRepository,
      commit: eccCommit,
    },
  };
}

export function readConfig(projectRoot) {
  const file = path.join(projectRoot, CONFIG_NAME);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function writeConfig(projectRoot, config) {
  fs.writeFileSync(path.join(projectRoot, CONFIG_NAME), `${JSON.stringify(config, null, 2)}\n`);
}

export function memoryEnvFromConfig(config) {
  if (!config?.memory) return {};
  const env = {
    TDAI_MEMORY_BRANCH: config.memory.branch || "tdai-memory",
  };
  if (config.memory.mode === "shared" && config.memory.remote) {
    env.TDAI_MEMORY_REMOTE = config.memory.remote;
  } else if (config.memory.remote && config.memory.remote !== "origin") {
    env.TDAI_MEMORY_REMOTE = config.memory.remote;
  }
  return env;
}
