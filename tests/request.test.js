const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

function loadRequestModule(sessionMock) {
  const requestPath = path.join(__dirname, "../miniprogram/utils/request.ts");
  const source = fs.readFileSync(requestPath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: requestPath,
  });

  const originalLoad = Module._load;
  Module._load = function patchedLoad(request, parent, isMain) {
    if (request === "./session") {
      return sessionMock;
    }

    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    const requestModule = new Module(requestPath, module);
    requestModule.filename = requestPath;
    requestModule.paths = Module._nodeModulePaths(path.dirname(requestPath));
    requestModule._compile(transpiled.outputText, requestPath);
    return requestModule.exports;
  } finally {
    Module._load = originalLoad;
  }
}

test("request sends the current token with every business request", async () => {
  const requestHeaders = [];
  const sessionMock = {
    ensureAuthenticated: async () => ({
      userId: "user-1",
      token: "initial-token",
      nickname: "宠友圈用户",
    }),
    recoverSession: async () => {
      throw new Error("recoverSession should not run");
    },
  };

  global.wx = {
    request({ header, success }) {
      requestHeaders.push(header);
      success({
        statusCode: 200,
        data: {
          code: 0,
          message: "ok",
          data: { ok: true },
        },
      });
    },
  };

  const { request } = loadRequestModule(sessionMock);

  await request({ method: "POST", path: "/posts/feed" });

  assert.equal(requestHeaders.length, 1);
  assert.equal(requestHeaders[0].Authorization, "Bearer initial-token");

  delete global.wx;
});

test("request recovers once on 401 and retries with the refreshed token", async () => {
  const requestHeaders = [];
  let recoverCalls = 0;
  const sessionMock = {
    ensureAuthenticated: async () => ({
      userId: "user-1",
      token: "expired-token",
      nickname: "宠友圈用户",
    }),
    recoverSession: async () => {
      recoverCalls += 1;
      return {
        userId: "user-1",
        token: "fresh-token",
        nickname: "宠友圈用户",
      };
    },
  };

  global.wx = {
    request({ header, success }) {
      requestHeaders.push(header);
      if (requestHeaders.length === 1) {
        success({
          statusCode: 401,
          data: {
            code: 40002,
            message: "Miniapp token expired or invalid.",
            data: null,
          },
        });
        return;
      }

      success({
        statusCode: 200,
        data: {
          code: 0,
          message: "ok",
          data: { ok: true },
        },
      });
    },
  };

  const { request } = loadRequestModule(sessionMock);
  const result = await request({ method: "POST", path: "/posts/feed" });

  assert.deepEqual(result, { ok: true });
  assert.equal(recoverCalls, 1);
  assert.equal(requestHeaders.length, 2);
  assert.equal(requestHeaders[0].Authorization, "Bearer expired-token");
  assert.equal(requestHeaders[1].Authorization, "Bearer fresh-token");

  delete global.wx;
});
