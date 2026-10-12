---
name: tencentdb-agent-memory
description: Читает и записывает слоистую память TencentDB Agent Memory проекта daily-usage командой node scripts/tdai-memory.mjs. Использовать в начале задачи и после устойчивых решений.
---

# TencentDB Agent Memory

Память проекта живёт в слоях L0 (реплики) → L1 (факты) → L2 (сцены) → L3 (профиль). Одна и та же память доступна облачному агенту (в том числе с телефона) и Cursor на компьютере: файлы лежат в ветке git `tdai-memory` этого репозитория.

| Команда | MCP-инструмент | Что делает |
|---|---|---|
| `node scripts/tdai-memory.mjs context` | — | профиль и последние записи, тот же текст, что подмешивает хук |
| `node scripts/tdai-memory.mjs read` | `tdai_core_read` | профиль L3 |
| `node scripts/tdai-memory.mjs search <запрос> [--type T] [--limit N]` | `tdai_memory_search` | поиск L1, плюс L2 и L3 |
| `node scripts/tdai-memory.mjs history <запрос>` | `tdai_conversation_search` | поиск сырых реплик L0 |
| `node scripts/tdai-memory.mjs save [--type T] <текст>` | `tdai_memory_save` | записать устойчивый факт |
| `node scripts/tdai-memory.mjs write-profile < файл` | `tdai_core_write` | перезаписать профиль целиком |

Ничего настраивать не нужно:

- В Cursor на компьютере (и в Cursor CLI) хук `beforeSubmitPrompt` из `.cursor/hooks.json` прикладывает профиль и последние 15 записей к первому сообщению каждого чата. Раздел называется «Память проекта (загружена автоматически)».
- Если раздела нет (облачный агент или хук не сработал), первым делом выполни `context`.
- LM Studio Bionic хук не запускает и читает навыки только из `.agents/skills` этого репозитория. Там лежат и память, и навыки ECC, поэтому они видны в палитре `@`. Команду `context` модель выполняет из корня проекта.
- Запуск команды в режиме Auto-review подсказывает классификатору `.cursor/permissions.json` (`autoRun.allow_instructions`). Личный allowlist пользователя он не заменяет.
- MCP-сервер `scripts/tdai-memory-mcp.mjs` с теми же инструментами в `.cursor/mcp.json` не прописан, потому что Cursor потребовал бы его одобрить. Подключать его вручную не обязательно, хранилище то же.

Поиск ищет все слова запроса как подстроки без учёта регистра. Короткий запрос из одного-двух корней слов находит больше.

## Как устроена синхронизация

- Чтение делает `git fetch` ветки `tdai-memory` и читает файлы прямо из коммита. Рабочая ветка и файлы проекта не меняются.
- Запись создаёт коммит поверх свежей `origin/tdai-memory` и сразу пушит. Если ветку параллельно изменил другой агент, запись повторяется поверх новой версии.
- Без сети чтение берёт последнюю скачанную копию и помечает ответ `stale: true`. Запись без сети завершается ошибкой, данные не теряются молча.
- Текст, похожий на ключ или токен, команда не сохраняет.

## Другие режимы

- `TDAI_MEMORY_DIR=<каталог>` — хранить в обычном каталоге, без git.
- `TDAI_MEMORY_BRANCH`, `TDAI_MEMORY_REMOTE` — другая ветка или remote.
- `TDAI_MEMORY_ENDPOINT`, `TDAI_MEMORY_API_KEY`, `TDAI_MEMORY_SERVICE_ID` — официальный Memory Core API v2 (`Authorization: Bearer` и `x-tdai-service-id`). Неполный набор переменных — ошибка, а не тихий переход в другой режим.

Полный Memory Hub (Docker-образы `agentmemory/memory-core`, `memory-hub`, `memory-proxy`) здесь не запущен: ему нужны Docker и ключи LLM. Источник: https://github.com/TencentCloud/TencentDB-Agent-Memory
