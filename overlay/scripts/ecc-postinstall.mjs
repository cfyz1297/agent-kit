#!/usr/bin/env node
// Runs after the ECC installer: removes the narrow skills listed in ecc-pruned-skills.json,
// keeps ecc-install-state.json portable, and regenerates docs/ecc-removed-skills.md.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CURSOR_SKILL_ROOTS = [".cursor/skills", ".cursor/.agents/skills"];
const BIONIC_SKILLS = ".agents/skills";
const SKILL_ROOTS = [...CURSOR_SKILL_ROOTS, BIONIC_SKILLS];
const STATE_PATH = ".cursor/ecc-install-state.json";
const PRUNE_LIST = "ecc-pruned-skills.json";
const DOC_PATH = "docs/ecc-removed-skills.md";

export function prunedNames(list) {
  return list.groups.flatMap((group) => group.skills.map((skill) => skill.name));
}

export function renderDoc(list) {
  const tree = `${list.eccRepository}/tree/${list.eccCommit}/skills`;
  const total = prunedNames(list).length;
  const lines = [
    "# Узкие навыки ECC, убранные из проекта",
    "",
    `Файл создаёт \`node scripts/ecc-postinstall.mjs\` из \`${PRUNE_LIST}\`. Правьте список там, а не здесь.`,
    "",
    `Из полной установки ECC убраны узкоспециализированные навыки, всего ${total}, чтобы их описания не занимали лишний контекст в каждом чате. Все они лежат в репозитории ECC на коммите [\`${list.eccCommit.slice(0, 8)}\`](${list.eccRepository}/tree/${list.eccCommit}).`,
    "",
    "## Как вернуть",
    "",
    "Один навык на время, без изменения проекта: откройте ссылку ниже и попросите агента прочитать `SKILL.md`.",
    "",
    `Насовсем: удалите навык из \`${PRUNE_LIST}\`. Если весь его модуль исключён в \`ecc-install.json\` (\`exclude\`), уберите оттуда и модуль. Затем повторите установку из README.`,
    "",
  ];
  for (const group of list.groups) {
    lines.push(`## ${group.title}`, "", group.reason, "", "| Навык | Модуль ECC | Описание |", "|---|---|---|");
    for (const skill of group.skills) {
      const description = skill.description.replaceAll("|", "\\|");
      lines.push(`| [\`${skill.name}\`](${tree}/${skill.name}) | \`${skill.module}\` | ${description} |`);
    }
    lines.push("");
  }
  return `${lines.join("\n").trimEnd()}\n`;
}

function relativize(value, prefix) {
  if (Array.isArray(value)) return value.map((item) => relativize(item, prefix));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== "sourcePath")
        .map(([key, item]) => [key, relativize(item, prefix)]),
    );
  }
  return typeof value === "string" && value.startsWith(prefix) ? value.slice(prefix.length).replaceAll("\\", "/") : value;
}

export function portableState(state, projectRoot, names) {
  const prefix = `${path.resolve(projectRoot)}${path.sep}`;
  const prunedPrefixes = SKILL_ROOTS.flatMap((root) => names.map((name) => `${root}/${name}/`));
  const relative = relativize(state, prefix);
  const isPruned = (destination) => {
    const normalized = String(destination || "").replaceAll("\\", "/");
    return prunedPrefixes.some((pruned) => normalized.startsWith(pruned));
  };
  return {
    ...relative,
    target: { ...relative.target, root: ".cursor", installStatePath: STATE_PATH },
    operations: (relative.operations || []).filter((operation) => !isPruned(operation.destinationPath)),
  };
}

export function findProblems(projectRoot) {
  const list = JSON.parse(fs.readFileSync(path.join(projectRoot, PRUNE_LIST), "utf8"));
  const names = prunedNames(list);
  const leftovers = SKILL_ROOTS.flatMap((root) => names.filter((name) => fs.existsSync(path.join(projectRoot, root, name))).map((name) => `${root}/${name}`));
  const stateText = fs.readFileSync(path.join(projectRoot, STATE_PATH), "utf8");
  const absolute = stateText.match(/"(?:[A-Za-z]:\\\\|\/)(?:Users|home|tmp|workspace|private|var)[^"]*"/g) || [];
  const docPath = path.join(projectRoot, DOC_PATH);
  const normalize = (text) => text.replaceAll("\r\n", "\n");
  const docStale = !fs.existsSync(docPath) || normalize(fs.readFileSync(docPath, "utf8")) !== renderDoc(list);
  return [
    ...leftovers.map((item) => `не удалён навык ${item}`),
    ...absolute.slice(0, 5).map((item) => `абсолютный путь в ${STATE_PATH}: ${item}`),
    ...(docStale ? [`${DOC_PATH} не совпадает с ${PRUNE_LIST}`] : []),
  ];
}

export function publishProjectSkills(projectRoot) {
  const destinationRoot = path.join(projectRoot, BIONIC_SKILLS);
  fs.mkdirSync(destinationRoot, { recursive: true });
  const published = [];
  for (const root of CURSOR_SKILL_ROOTS) {
    const sourceRoot = path.join(projectRoot, root);
    if (!fs.existsSync(sourceRoot)) continue;
    for (const entry of fs.readdirSync(sourceRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const source = path.join(sourceRoot, entry.name);
      if (!fs.existsSync(path.join(source, "SKILL.md"))) continue;
      const destination = path.join(destinationRoot, entry.name);
      if (fs.existsSync(destination)) continue;
      fs.cpSync(source, destination, { recursive: true });
      published.push(path.relative(projectRoot, destination));
    }
  }
  return published;
}

export function postinstall(projectRoot) {
  const list = JSON.parse(fs.readFileSync(path.join(projectRoot, PRUNE_LIST), "utf8"));
  const names = prunedNames(list);
  const removed = SKILL_ROOTS.flatMap((root) =>
    names
      .map((name) => path.join(projectRoot, root, name))
      .filter((dir) => fs.existsSync(dir))
      .map((dir) => {
        fs.rmSync(dir, { recursive: true, force: true });
        return path.relative(projectRoot, dir);
      }),
  );
  const statePath = path.join(projectRoot, STATE_PATH);
  const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  fs.writeFileSync(statePath, `${JSON.stringify(portableState(state, projectRoot, names), null, 2)}\n`, "utf8");
  fs.mkdirSync(path.dirname(path.join(projectRoot, DOC_PATH)), { recursive: true });
  fs.writeFileSync(path.join(projectRoot, DOC_PATH), renderDoc(list), "utf8");
  publishProjectSkills(projectRoot);
  return removed;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  if (process.argv.includes("--check")) {
    const problems = findProblems(projectRoot);
    problems.forEach((problem) => console.error(problem));
    process.exit(problems.length ? 1 : 0);
  }
  const removed = postinstall(projectRoot);
  console.log(`Удалено каталогов навыков: ${removed.length}. Состояние установки и ${DOC_PATH} обновлены.`);
}
