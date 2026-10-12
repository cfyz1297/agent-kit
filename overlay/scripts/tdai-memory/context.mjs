import { createBackend } from "./memory.mjs";
import { createRemoteMemory, remoteConfig } from "./remote.mjs";
import { readPersona, recentRecords, sceneNames } from "./store.mjs";

export const CONTEXT_HEADING = "# Память проекта (загружена автоматически)";
const RECENT_LIMIT = 15;
const MAX_LENGTH = 8000;

const USAGE = [
  "Профиль и последние записи уже загружены, `read` выполнять не нужно.",
  'Подробности по теме: `node scripts/tdai-memory.mjs search "<слова>"`.',
  'Устойчивые решения сохраняй: `node scripts/tdai-memory.mjs save --type decision "<что и почему>"`.',
].join("\n");

function clip(text) {
  return text.length <= MAX_LENGTH ? text : `${text.slice(0, MAX_LENGTH)}\n\n[обрезано, остальное через search]`;
}

export function formatContext({ source, persona, records = [], scenes = [], warning }) {
  const lines = [CONTEXT_HEADING, "", `Источник: ${source}.`, ...(warning ? [`Внимание: ${warning}`] : []), "", USAGE, "", "## Профиль", "", persona.trim()];
  if (records.length) {
    lines.push("", "## Последние записи", "", ...records.map((record) => `- [${record.type}] ${record.content} (${String(record.created_at || "").slice(0, 10)})`));
  }
  if (scenes.length) {
    lines.push("", "## Сцены L2 (полный текст через search)", "", ...scenes.map((name) => `- ${name}`));
  }
  return clip(lines.join("\n"));
}

export function formatUnavailable(reason) {
  return [
    CONTEXT_HEADING,
    "",
    `Память загрузить не удалось: ${reason}`,
    "Попробуй `node scripts/tdai-memory.mjs read` и, если ошибка повторится, сообщи о ней пользователю.",
  ].join("\n");
}

export async function loadSessionContext(env = process.env) {
  const remote = remoteConfig(env);
  if (remote) {
    const core = await createRemoteMemory(remote).coreRead();
    return formatContext({ source: "Memory Core API v2", persona: String(core.content ?? "") });
  }
  const { files, info } = createBackend(env).load();
  const source = info.backend === "git" ? `ветка git ${info.branch}, коммит ${String(info.commit || "нет").slice(0, 7)}` : `каталог ${info.dir}`;
  return formatContext({
    source,
    persona: readPersona(files),
    records: recentRecords(files, RECENT_LIMIT),
    scenes: sceneNames(files),
    warning: info.stale ? `сеть недоступна, показана последняя скачанная копия (${info.warning})` : undefined,
  });
}
