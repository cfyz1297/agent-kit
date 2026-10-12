---
name: tencentdb-agent-memory
description: Старт каждой новой сессии в репозитории daily-usage. Сначала загрузи память, затем сам открой подходящий навык из списка и следуй ему, не дожидаясь @. Use at the start of every session and for any question, feature, bug, test, refactor, review, or code change.
---

# Память и навыки

Это та же память, что у агента Cursor. Она лежит в ветке git `tdai-memory` этого репозитория. Ветку не переключай и файлы памяти не коммить вручную.

Команды запускай из корня репозитория, где лежит `scripts/tdai-memory.mjs`.

До ответа выполни и опирайся на вывод:

```
node scripts/tdai-memory.mjs context
```

Затем без символа @ прочитай `.agents/skills/INDEX.md` и открой `SKILL.md` одного подходящего навыка. Для новой функции, исправления и рефакторинга это `tdd-workflow`.

Подробности по теме:

```
node scripts/tdai-memory.mjs search "<одно-два слова>"
```

После устойчивого решения, схемы, договорённости или предпочтения:

```
node scripts/tdai-memory.mjs save --type decision "<что решили и почему>"
```

Типы: `fact`, `decision`, `preference`, `constraint`. Секреты, ключи и токены не сохраняй. Если команда завершилась ошибкой, скажи об этом пользователю.
