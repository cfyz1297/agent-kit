import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

export async function askMemoryChoice({ memory, memoryRemote, yes } = {}) {
  if (memory === "shared" || memory === "local") {
    return { memory, memoryRemote };
  }
  if (yes) {
    return { memory: "local", memoryRemote };
  }

  const rl = readline.createInterface({ input, output });
  try {
    console.log("Память агента:");
    console.log("  1) Своя ветка tdai-memory в этом репозитории (по умолчанию)");
    console.log("  2) Общий remote (одна память на несколько проектов)");
    const answer = (await rl.question("Выбор [1/2]: ")).trim() || "1";
    if (answer === "2") {
      const remote =
        memoryRemote ||
        (await rl.question("URL git-репозитория с веткой tdai-memory: ")).trim();
      if (!remote) throw new Error("Нужен URL remote для общей памяти");
      return { memory: "shared", memoryRemote: remote };
    }
    return { memory: "local", memoryRemote };
  } finally {
    rl.close();
  }
}
