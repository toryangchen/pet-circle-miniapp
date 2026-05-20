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

test("bootstrapSession logs in and persists the server token", async () => {
  const storage = {};
  const requestUrls = [];

  global.wx = {
    login({ success }) {
      success({ code: "wx-login-code" });
    },
    request({ url, success }) {
      requestUrls.push(url);
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
                bgType: "main-bg-01",
                gender: null,
                birthday: null,
                region: {
                  province: null,
                  city: null,
                  district: null,
                },
                phoneAuthorized: false,
                profileAuthorized: false,
              },
            },
          },
        });
        return;
      }

      throw new Error(`Unexpected request URL: ${url}`);
    },
    getStorageSync(key) {
      return storage[key];
    },
    setStorageSync(key, value) {
      storage[key] = value;
    },
    removeStorageSync(key) {
      delete storage[key];
    },
  };

  const { bootstrapSession, getAuthState } = loadSessionModule();

  await bootstrapSession();

  assert.equal(requestUrls[0], "https://pet.toryang.cc/api/auth/miniapp/login");
  assert.equal(requestUrls.length, 1);
  assert.equal(getAuthState().session?.token, "server-token");
  assert.deepEqual(storage.pet_circle_miniapp_session, {
    userId: "user-1",
    token: "server-token",
    nickname: "宠友圈用户",
  });

  delete global.wx;
});

test("bootstrapSession restores a stored token and syncs the current user", async () => {
  const storage = {
    pet_circle_miniapp_session: {
      userId: "user-1",
      token: "stored-token",
      nickname: "旧昵称",
    },
  };
  const requestUrls = [];
  let loginCalls = 0;

  global.wx = {
    login() {
      loginCalls += 1;
      throw new Error("wx.login should not run when stored token is valid");
    },
    request({ url, header, success }) {
      requestUrls.push(url);
      if (url.endsWith("/auth/me")) {
        assert.equal(header.Authorization, "Bearer stored-token");
        success({
          statusCode: 200,
          data: {
            code: 0,
            message: "ok",
            data: {
              id: "user-1",
              nickname: "新昵称",
              avatarUrl: null,
              bgType: "main-bg-01",
              gender: null,
              birthday: null,
              region: {
                province: null,
                city: null,
                district: null,
              },
              phoneAuthorized: true,
              profileAuthorized: false,
              phoneMasked: "138****5678",
            },
          },
        });
        return;
      }

      throw new Error(`Unexpected request URL: ${url}`);
    },
    getStorageSync(key) {
      return storage[key];
    },
    setStorageSync(key, value) {
      storage[key] = value;
    },
    removeStorageSync(key) {
      delete storage[key];
    },
  };

  const { bootstrapSession, getAuthState } = loadSessionModule();

  await bootstrapSession();

  assert.equal(loginCalls, 0);
  assert.deepEqual(requestUrls, ["https://pet.toryang.cc/api/auth/me"]);
  assert.equal(getAuthState().session?.token, "stored-token");
  assert.equal(getAuthState().user?.nickname, "新昵称");
  assert.equal(getAuthState().phoneAuthorized, true);

  delete global.wx;
});
