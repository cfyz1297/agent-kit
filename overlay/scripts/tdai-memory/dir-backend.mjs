import fs from "node:fs";
import path from "node:path";
import { isMemoryFile } from "./store.mjs";

function listFiles(root, prefix = "") {
  const directory = path.join(root, prefix);
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    return entry.isDirectory() ? listFiles(root, relative) : [relative];
  });
}

export function createDirBackend(root) {
  const resolved = path.resolve(root);

  function load() {
    const entries = listFiles(resolved)
      .filter(isMemoryFile)
      .map((name) => [name, fs.readFileSync(path.join(resolved, name), "utf8")]);
    return { files: Object.fromEntries(entries), info: { backend: "dir", dir: resolved } };
  }

  return {
    load,
    update(apply) {
      const changes = apply(load().files);
      for (const [name, content] of Object.entries(changes)) {
        const target = path.join(resolved, name);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, content, "utf8");
      }
      return { backend: "dir", dir: resolved };
    },
  };
}
