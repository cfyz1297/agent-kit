import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DESCRIPTION_LIMIT = 160;

export function skillDescription(markdown) {
  const frontmatter = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatter) return "";
  const body = frontmatter[1];
  const quoted = body.match(/^description:\s*"([\s\S]*?)"\s*$/m);
  const plain = body.match(/^description:\s*([^"|>\n].*)$/m);
  const folded = body.match(/^description:\s*[>|]-?\s*\r?\n((?:[ \t].*(?:\r?\n)?)*)/m);
  const raw = quoted?.[1] || (plain ? plain[1] : folded?.[1]?.replace(/^[ \t]+/gm, "") || "");
  return raw.replace(/\s+/g, " ").trim().slice(0, DESCRIPTION_LIMIT);
}

export function renderSkillsIndex(skillsDir) {
  const names = fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(skillsDir, entry.name, "SKILL.md")))
    .map((entry) => entry.name)
    .sort();
  const lines = names.map((name) => {
    const description = skillDescription(fs.readFileSync(path.join(skillsDir, name, "SKILL.md"), "utf8"));
    return description ? `- \`${name}\` — ${description}` : `- \`${name}\``;
  });
  return [
    "# Навыки проекта",
    "",
    "В начале сессии прочитай этот список и открой один подходящий `.agents/skills/<имя>/SKILL.md`. Символ @ для этого не нужен.",
    "Для новой функции, исправления и рефакторинга открой `tdd-workflow`.",
    "",
    ...lines,
    "",
  ].join("\n");
}

function main() {
  const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const skillsDir = path.join(projectRoot, ".agents", "skills");
  fs.writeFileSync(path.join(skillsDir, "INDEX.md"), renderSkillsIndex(skillsDir));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
