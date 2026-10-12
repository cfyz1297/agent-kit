import assert from "node:assert/strict";
import http from "node:http";
import { after, before, test } from "node:test";
import { createRemoteMemory, remoteConfig } from "./remote.mjs";

const requests = [];
let server;
let endpoint;

before(async () => {
  server = http.createServer((request, response) => {
    let body = "";
    request.on("data", (chunk) => (body += chunk));
    request.on("end", () => {
      requests.push({ url: request.url, headers: request.headers, body: JSON.parse(body || "{}") });
      if (request.url === "/v2/core/read") return response.end(JSON.stringify({ code: 0, data: { content: "профиль" } }));
      if (request.url === "/v2/atomic/search") return response.end(JSON.stringify({ code: 7, message: "квота" }));
      if (request.url === "/v2/conversation/search") return response.end("не json");
      if (request.url === "/v2/core/write") {
        response.statusCode = 500;
        return response.end(JSON.stringify({ message: "упал" }));
      }
      return response.end(JSON.stringify({ code: 0, data: { accepted: true } }));
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  endpoint = `http://127.0.0.1:${server.address().port}/`;
});

after(() => server.close());

test("конфигурация: нет переменных, неполный набор, полный набор", () => {
  assert.equal(remoteConfig({}), null);
  assert.throws(() => remoteConfig({ TDAI_MEMORY_API_KEY: "k" }), /все три переменные/);
  assert.deepEqual(remoteConfig({ TDAI_MEMORY_ENDPOINT: "https://x/", TDAI_MEMORY_API_KEY: "k", TDAI_MEMORY_SERVICE_ID: "s" }), {
    endpoint: "https://x",
    apiKey: "k",
    serviceId: "s",
  });
});

test("запросы к Memory Core v2 и разбор ошибок", async () => {
  const memory = createRemoteMemory(remoteConfig({ TDAI_MEMORY_ENDPOINT: endpoint, TDAI_MEMORY_API_KEY: "key", TDAI_MEMORY_SERVICE_ID: "svc" }));

  assert.deepEqual(await memory.coreRead(), { mode: "remote", content: "профиль" });
  const read = requests.at(-1);
  assert.equal(read.headers.authorization, "Bearer key");
  assert.equal(read.headers["x-tdai-service-id"], "svc");

  assert.equal((await memory.save({ content: "факт" })).accepted, true);
  assert.equal(requests.at(-1).body.messages[0].content, "факт");
  await assert.rejects(memory.save({ content: "sk-abcdefghijklmnopqrstuvwxyz" }), /секрет/);

  await assert.rejects(memory.search({ query: "x", type: "fact" }), /code=7: квота/);
  assert.equal(requests.at(-1).body.type, "fact");
  await assert.rejects(memory.conversationSearch({ query: "x" }), /не-JSON/);
  await assert.rejects(memory.coreWrite({ content: "новый" }), /HTTP 500: упал/);
});
