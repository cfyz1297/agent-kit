import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_TARGETS,
  buildConfig,
  parseArgs,
  resolveMemoryChoice,
} from "../lib/config.mjs";

test("parseArgs: setup с памятью shared и remote", () => {
  const args = parseArgs([
    "setup",
    "--project",
    "/tmp/app",
    "--memory",
    "shared",
    "--memory-remote",
    "https://github.com/cfyz1297/daily-usage.git",
    "--targets",
    "cursor,bionic",
  ]);
  assert.equal(args.command, "setup");
  assert.equal(args.project, "/tmp/app");
  assert.equal(args.memory, "shared");
  assert.equal(args.memoryRemote, "https://github.com/cfyz1297/daily-usage.git");
  assert.deepEqual(args.targets, ["cursor", "bionic"]);
});

test("parseArgs: install без флагов", () => {
  const args = parseArgs(["install"]);
  assert.equal(args.command, "install");
  assert.equal(args.project, ".");
  assert.equal(args.memory, undefined);
  assert.deepEqual(args.targets, DEFAULT_TARGETS);
  assert.equal(args.targetsExplicit, false);
});

test("parseArgs: --targets помечает explicit", () => {
  const args = parseArgs(["install", "--targets", "cursor"]);
  assert.deepEqual(args.targets, ["cursor"]);
  assert.equal(args.targetsExplicit, true);
});

test("parseArgs: --only skills|memory|all", () => {
  assert.equal(parseArgs(["update", "--only", "skills"]).only, "skills");
  assert.equal(parseArgs(["update", "--only", "memory"]).only, "memory");
  assert.equal(parseArgs(["update"]).only, "all");
  assert.throws(() => parseArgs(["update", "--only", "nope"]), /only/);
});

test("resolveMemoryChoice: default local", () => {
  assert.deepEqual(resolveMemoryChoice({ memory: undefined }), {
    mode: "local",
    remote: "origin",
    branch: "tdai-memory",
  });
});

test("resolveMemoryChoice: shared требует remote", () => {
  assert.throws(
    () => resolveMemoryChoice({ memory: "shared" }),
    /memory-remote|--memory-remote/,
  );
  assert.deepEqual(
    resolveMemoryChoice({
      memory: "shared",
      memoryRemote: "https://github.com/cfyz1297/daily-usage.git",
    }),
    {
      mode: "shared",
      remote: "https://github.com/cfyz1297/daily-usage.git",
      branch: "tdai-memory",
    },
  );
});

test("buildConfig собирает .agent-kit.json", () => {
  const cfg = buildConfig({
    targets: ["cursor", "bionic"],
    memory: resolveMemoryChoice({ memory: "local" }),
    eccCommit: "abc123",
    eccRepository: "https://github.com/affaan-m/ECC",
  });
  assert.equal(cfg.version, 1);
  assert.deepEqual(cfg.targets, ["cursor", "bionic"]);
  assert.equal(cfg.memory.mode, "local");
  assert.equal(cfg.ecc.commit, "abc123");
});
