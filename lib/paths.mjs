import path from "node:path";
import { fileURLToPath } from "node:url";

export const KIT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const TEMPLATES = path.join(KIT_ROOT, "templates");
export const OVERLAY = path.join(KIT_ROOT, "overlay");

export function resolveProject(project) {
  return path.resolve(project || ".");
}
