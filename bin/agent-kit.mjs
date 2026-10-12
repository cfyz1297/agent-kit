#!/usr/bin/env node
import { parseArgs, resolveMemoryChoice } from "../lib/config.mjs";
import { detectInstallation } from "../lib/detect.mjs";
import { doctor } from "../lib/doctor.mjs";
import { installIntoProject, loadInstallPlan } from "../lib/install.mjs";
import { resolveProject } from "../lib/paths.mjs";
import { askMemoryChoice } from "../lib/prompt.mjs";

const USAGE = `agent-kit — ECC skills + память агента для Cursor / Claude / Codex / Bionic

  agent-kit setup   [--project DIR] [--targets a,b] [--memory local|shared] [--memory-remote URL] [--only all|skills|memory] [--yes]
  agent-kit install [--project DIR] [--latest] [--only all|skills|memory]
  agent-kit update  [--project DIR] [--latest] [--only all|skills|memory]
  agent-kit doctor  [--project DIR]

Если в проекте уже есть скиллы и/или память (как в daily-usage), setup/install/update
просто обновляют то, что найдено (или то, что указано в --only).

Память по умолчанию: своя ветка tdai-memory в проекте.
Общая память: --memory shared --memory-remote https://github.com/USER/REPO.git

Скиллы ECC при install/update клонируются с https://github.com/affaan-m/ECC (не вендорятся в kit).
`;

async function runSetup(args) {
  const projectRoot = resolveProject(args.project);
  const detected = detectInstallation(projectRoot);
  const plan = loadInstallPlan(projectRoot, { ...args, command: "setup" });

  let memory = plan.memory;
  if (args.memory != null) {
    memory = resolveMemoryChoice({
      memory: args.memory,
      memoryRemote: args.memoryRemote,
      memoryBranch: args.memoryBranch,
    });
  } else if (!detected.hasMemory) {
    const choice = await askMemoryChoice(args);
    memory = resolveMemoryChoice({
      memory: choice.memory,
      memoryRemote: choice.memoryRemote,
      memoryBranch: args.memoryBranch,
    });
  }

  const result = await installIntoProject({
    projectRoot,
    targets: plan.targets,
    memory,
    latest: args.latest,
    updateOnly: detected.hasSkills || detected.hasMemory,
    components: plan.components,
    only: args.only,
  });
  printResult("setup", projectRoot, result);
}

async function runInstall(args, { update = false } = {}) {
  const projectRoot = resolveProject(args.project);
  const plan = loadInstallPlan(projectRoot, { ...args, command: update ? "update" : "install" });
  const memory =
    args.memory != null
      ? resolveMemoryChoice({
          memory: args.memory,
          memoryRemote: args.memoryRemote,
          memoryBranch: args.memoryBranch,
        })
      : plan.memory;
  const result = await installIntoProject({
    projectRoot,
    targets: plan.targets,
    memory,
    latest: args.latest || update,
    updateOnly: update || plan.detected.hasSkills || plan.detected.hasMemory,
    components: plan.components,
    only: args.only,
  });
  printResult(update ? "update" : "install", projectRoot, result);
}

function printResult(label, projectRoot, result) {
  console.log(`agent-kit ${label}: ${projectRoot}`);
  console.log(`  targets: ${result.config.targets.join(", ")}`);
  console.log(`  memory:  ${result.config.memory.mode} (${result.config.memory.remote})`);
  console.log(`  ecc:     ${result.config.ecc.commit.slice(0, 8)}`);
  console.log(
    `  components: skills=${result.components?.skills} memory=${result.components?.memory}`,
  );
  for (const note of result.notes || []) console.log(`  note:    ${note}`);
}

function runDoctor(args) {
  const projectRoot = resolveProject(args.project);
  const checks = doctor(projectRoot);
  let failed = 0;
  for (const check of checks) {
    const mark = check.ok ? "OK" : "FAIL";
    if (!check.ok) failed += 1;
    console.log(`[${mark}] ${check.name}: ${check.detail}`);
  }
  if (failed) process.exitCode = 1;
}

async function main(argv) {
  let args;
  try {
    args = parseArgs(argv);
  } catch (error) {
    console.error(error.message);
    console.log(USAGE);
    process.exitCode = 2;
    return;
  }

  if (args.help || args.command === "help" || !args.command) {
    console.log(USAGE);
    return;
  }

  switch (args.command) {
    case "setup":
      await runSetup(args);
      break;
    case "install":
      await runInstall(args);
      break;
    case "update":
      await runInstall(args, { update: true });
      break;
    case "doctor":
      runDoctor(args);
      break;
    default:
      console.error(`Неизвестная команда: ${args.command}`);
      console.log(USAGE);
      process.exitCode = 2;
  }
}

main(process.argv.slice(2)).catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
