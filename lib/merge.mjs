export function mergeHooksJson(existing, template) {
  const base = existing && typeof existing === "object" ? structuredClone(existing) : { version: 1, hooks: {} };
  const tmpl = template && typeof template === "object" ? template : { hooks: {} };
  base.version = base.version ?? tmpl.version ?? 1;
  base.hooks = base.hooks || {};
  const tmplHooks = tmpl.hooks || {};

  for (const [event, entries] of Object.entries(tmplHooks)) {
    const list = Array.isArray(entries) ? entries : [];
    const current = Array.isArray(base.hooks[event]) ? base.hooks[event] : [];
    const merged = [...current];
    for (const entry of list) {
      const key = hookKey(entry);
      if (!merged.some((item) => hookKey(item) === key)) merged.push(entry);
    }
    base.hooks[event] = merged;
  }
  return base;
}

function hookKey(entry) {
  if (!entry || typeof entry !== "object") return String(entry);
  return String(entry.command || entry.matcher || JSON.stringify(entry));
}

export function mergePermissionsJson(existing, template) {
  const base = existing && typeof existing === "object" ? structuredClone(existing) : {};
  const tmpl = template && typeof template === "object" ? template : {};
  const allow = new Set([
    ...((base.autoRun && base.autoRun.allow_instructions) || []),
    ...((tmpl.autoRun && tmpl.autoRun.allow_instructions) || []),
  ]);
  return {
    ...base,
    ...tmpl,
    autoRun: {
      ...(base.autoRun || {}),
      ...(tmpl.autoRun || {}),
      allow_instructions: [...allow],
    },
  };
}
