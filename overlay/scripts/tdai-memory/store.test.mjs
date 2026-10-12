import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CONVERSATIONS_PATH,
  RECORDS_PATH,
  isMemoryFile,
  limitOf,
  preparePersonaWrite,
  prepareSave,
  readPersona,
  searchConversations,
  searchMemory,
} from "./store.mjs";

const files = Object.freeze({
  "persona.md": "# Профиль\n\nКаталог товаров.\n",
  "scene_blocks/catalog.md": "# Каталог\n\nТаблица categories.\n",
  [RECORDS_PATH]: [
    JSON.stringify({ id: "a", type: "fact", content: "ECC подключён профилем minimal" }),
    "битая строка",
    JSON.stringify({ id: "b", type: "decision", content: "Подсчёт через LEFT JOIN" }),
  ].join("\n"),
  [CONVERSATIONS_PATH]: `${JSON.stringify({ id: "m", role: "user", message_text: "Посчитай через LEFT JOIN" })}\n`,
});

test("поиск по слоям L1, L2, L3 и фильтр типа", () => {
  assert.deepEqual(searchMemory(files, { query: "left join" }).map((item) => item.id), ["b"]);
  assert.deepEqual(searchMemory(files, { query: "каталог" }).map((item) => item.layer), ["L2", "L3"]);
  assert.deepEqual(searchMemory(files, { query: "", type: "fact" }).map((item) => item.id), ["a"]);
  assert.deepEqual(searchConversations(files, { query: "join" }).map((item) => item.id), ["m"]);
});

test("запись дописывает строки и не меняет исходные файлы", () => {
  const { atom, apply } = prepareSave({ content: "  Новый факт  ", type: "unknown" });
  assert.equal(atom.type, "fact");
  assert.equal(atom.content, "Новый факт");
  const changes = apply(files);
  assert.ok(changes[RECORDS_PATH].startsWith(files[RECORDS_PATH]));
  assert.match(changes[RECORDS_PATH], /Новый факт/);
  assert.match(changes[CONVERSATIONS_PATH], /Новый факт/);
  assert.equal(apply({})[RECORDS_PATH].split("\n").filter(Boolean).length, 1);
});

test("пустой текст и секреты отклоняются", () => {
  assert.throws(() => prepareSave({ content: "   " }), /пустым/);
  assert.throws(() => prepareSave({ content: "токен ghp_abcdefghijklmnopqrstuvwxyz0123" }), /секрет/);
  assert.throws(() => preparePersonaWrite({ content: "-----BEGIN RSA PRIVATE KEY-----" }), /секрет/);
});

test("профиль по умолчанию и перезапись", () => {
  assert.match(readPersona({}), /не заполнена/);
  assert.deepEqual(preparePersonaWrite({ content: "# П" })(), { "persona.md": "# П\n" });
});

test("служебные функции", () => {
  assert.equal(limitOf({}), 5);
  assert.equal(limitOf({ limit: 100 }), 20);
  assert.equal(limitOf({ limit: "abc" }), 5);
  assert.ok(isMemoryFile("records/store.jsonl"));
  assert.ok(!isMemoryFile("README.md"));
  assert.ok(!isMemoryFile("records/nested/store.jsonl"));
});
