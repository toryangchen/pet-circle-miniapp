const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

function loadSessionModule() {
  const sessionPath = path.join(__dirname, "../miniprogram/utils/session.ts");
  const source = fs.readFileSync(sessionPath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: sessionPath,
  });

  const sessionModule = new Module(sessionPath, module);
  sessionModule.filename = sessionPath;
  sessionModule.paths = Module._nodeModulePaths(path.dirname(sessionPath));
  sessionModule._compile(transpiled.outputText, sessionPath);

  return sessionModule.exports;
}

test("bootstrapSession does not read or write local storage before logging in", async () => {
  const storageCalls = [];

  global.wx = {
    login({ success }) {
      success({ code: "wx-login-code" });
    },
    request({ url, success }) {
      if (url.endsWith("/auth/miniapp/login")) {
        success({
          statusCode: 200,
          data: {
            code: 0,
            message: "ok",
            data: {
              token: "server-token",
              user: {
                id: "user-1",
                nickname: "宠友圈用户",
                avatarUrl: null,
                phoneAuthorized: false,
                profileAuthorized: false,
              },
            },
          },
        });
        return;
      }

      if (url.endsWith("/auth/me")) {
        success({
          statusCode: 200,
          data: {
            code: 0,
            message: "ok",
            data: {
              id: "user-1",
              nickname: "宠友圈用户",
              avatarUrl: null,
              phoneAuthorized: false,
              profileAuthorized: false,
            },
          },
        });
        return;
      }

      throw new Error(`Unexpected request URL: ${url}`);
    },
    getStorageSync(key) {
      storageCalls.push(["get", key]);
      return undefined;
    },
    setStorageSync(key, value) {
      storageCalls.push(["set", key, value]);
    },
    removeStorageSync(key) {
      storageCalls.push(["remove", key]);
    },
  };

  const { bootstrapSession, getAuthState } = loadSessionModule();

  await bootstrapSession();

  assert.deepEqual(storageCalls, []);
  assert.equal(getAuthState().session?.token, "server-token");

  delete global.wx;
});
