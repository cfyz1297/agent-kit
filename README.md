# agent-kit

Установщик [ECC](https://github.com/affaan-m/ECC)-навыков и системы памяти агента (слои L0–L3 в git-ветке `tdai-memory`) для **Cursor**, **Claude Code**, **Codex** и **LM Studio Bionic**.

Навыки **не** лежат в этом репозитории: при `install` / `update` клонируется свежий [affaan-m/ECC](https://github.com/affaan-m/ECC) (закреплённый коммит или `--latest`). Поверх накатываются наши overlays памяти из этого kit.

Опыт обкатан в [cfyz1297/daily-usage](https://github.com/cfyz1297/daily-usage).

## Быстрый старт

Из корня **целевого** git-репозитория:

```bash
npx --yes github:cfyz1297/agent-kit setup
```

Или клон:

```bash
git clone https://github.com/cfyz1297/agent-kit.git
node agent-kit/bin/agent-kit.mjs setup --project .
```

Неинтерактивно (своя ветка памяти):

```bash
node bin/agent-kit.mjs setup --project /path/to/app --yes --targets cursor,bionic,claude,codex
```

Общая память на несколько проектов:

```bash
node bin/agent-kit.mjs setup --project /path/to/app \
  --memory shared \
  --memory-remote https://github.com/cfyz1297/daily-usage.git
```

## Команды

| Команда | Назначение |
|---------|------------|
| `setup` | Спросить/принять настройки памяти (если памяти ещё нет), записать `.agent-kit.json`, поставить или **обновить** ECC + overlays |
| `install` | Установка или обновление по `.agent-kit.json` / автодетекту |
| `update` | Обновить уже стоящие компоненты: ECC с upstream + overlays памяти |
| `doctor` | Проверить Node, git, skills, хук, `context` |

### Уже установленные скиллы / память

Если в проекте уже есть ECC-скиллы и/или память (как в [daily-usage](https://github.com/cfyz1297/daily-usage) — даже без `.agent-kit.json`), `setup` / `install` / `update` это замечают и **обновляют**, а не ставят с нуля:

- скиллы → повторный clone ECC + `install-apply` + prune + `INDEX.md`
- память → обновление `scripts/tdai-memory*`, хука, rule и навыков памяти; чужие хуки в `.cursor/hooks.json` и ваш `AGENTS.md` сохраняются
- seed ветки `tdai-memory` не пишется, если профиль уже заполнен

Ограничить область:

```bash
node bin/agent-kit.mjs update --project . --only skills
node bin/agent-kit.mjs update --project . --only memory
node bin/agent-kit.mjs update --project . --only all      # по умолчанию: только то, что уже есть
```

## Targets

| Target | Что делает |
|--------|------------|
| `cursor` | `install-apply` → `.cursor/*`, хук памяти, rule, permissions |
| `claude` | `install-apply` с `target: claude` |
| `codex` | `codex plugin marketplace add affaan-m/ECC` + `plugin add ecc@ecc` (если CLI есть) |
| `bionic` | `.agents/skills` + `INDEX.md` + `AGENTS.md` + навык памяти (без `@`) |

По умолчанию ставятся все четыре.

## Память

- **local (по умолчанию)** — ветка `tdai-memory` в **этом** репозитории (`origin`).
- **shared** — тот же протокол, но `fetch`/`push` на `--memory-remote` (URL другого репо).

CLI в проекте после установки:

```bash
node scripts/tdai-memory.mjs context
node scripts/tdai-memory.mjs search "тема"
node scripts/tdai-memory.mjs save --type decision "что решили"
```

Опционально официальный TencentDB Memory Core: `TDAI_MEMORY_ENDPOINT`, `TDAI_MEMORY_API_KEY`, `TDAI_MEMORY_SERVICE_ID`.

## Обновление ECC

Pin коммита — в `templates/ecc-pruned-skills.json` (`eccCommit`). В установленном проекте:

```bash
node path/to/agent-kit/bin/agent-kit.mjs update --project . --latest
```

После apply снова режется список из `ecc-pruned-skills.json` и пересобирается `.agents/skills/INDEX.md`.

## Требования

- Node.js 18+
- git
- сеть для клона ECC (и push памяти)

## Лицензии

- Код agent-kit — MIT (см. `LICENSE`).
- ECC — MIT (`third_party/ecc/LICENSE`).
