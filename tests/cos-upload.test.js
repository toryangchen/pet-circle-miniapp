const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

function loadCosUploadModule({ requestMock, cosFactoryMock }) {
  const modulePath = path.join(__dirname, "../miniprogram/utils/cos-upload.ts");
  const source = fs.readFileSync(modulePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      baseUrl: path.join(__dirname, ".."),
      paths: {
        "@*": ["miniprogram/*"],
      },
    },
    fileName: modulePath,
  });

  const originalLoad = Module._load;
  Module._load = function patchedLoad(request, parent, isMain) {
    if (request === "./request") {
      return { request: requestMock };
    }

    if (request === "./cos-wx-sdk-v5") {
      return cosFactoryMock;
    }

    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    const loadedModule = new Module(modulePath, module);
    loadedModule.filename = modulePath;
    loadedModule.paths = Module._nodeModulePaths(path.dirname(modulePath));
    loadedModule._compile(transpiled.outputText, modulePath);
    return loadedModule.exports;
  } finally {
    Module._load = originalLoad;
  }
}

test("uploadImageToCos requests a ticket and returns the uploaded resource URL", async () => {
  const requestCalls = [];
  const uploadedObjects = [];

  const { uploadImageToCos } = loadCosUploadModule({
    requestMock(options) {
      requestCalls.push(options);
      return Promise.resolve({
        bucket: "petcircle-1322740877",
        region: "ap-beijing",
        key: "miniapp/avatar/user-1/123456-demo.png",
        resourceUrl:
          "https://petcircle-1322740877.cos.ap-beijing.myqcloud.com/miniapp/avatar/user-1/123456-demo.png",
        startTime: 1712912400,
        expiredTime: 1712913300,
        credentials: {
          tmpSecretId: "tmp-secret-id",
          tmpSecretKey: "tmp-secret-key",
          sessionToken: "tmp-session-token",
        },
      });
    },
    cosFactoryMock: function MockCos(options) {
      this.options = options;
      this.putObject = (payload, callback) => {
        uploadedObjects.push({ options, payload });
        callback(null, { statusCode: 200 });
      };
    },
  });

  const result = await uploadImageToCos({
    kind: "avatar",
    filePath: "/tmp/avatar.png",
  });

  assert.equal(
    result.url,
    "https://petcircle-1322740877.cos.ap-beijing.myqcloud.com/miniapp/avatar/user-1/123456-demo.png",
  );
  assert.deepEqual(requestCalls, [
    {
      method: "POST",
      path: "/assets/cos-sts",
      data: {
        kind: "avatar",
        filename: "avatar.png",
      },
    },
  ]);
  assert.equal(uploadedObjects.length, 1);
  assert.equal(uploadedObjects[0].payload.Bucket, "petcircle-1322740877");
  assert.equal(uploadedObjects[0].payload.Region, "ap-beijing");
  assert.equal(
    uploadedObjects[0].payload.Key,
    "miniapp/avatar/user-1/123456-demo.png",
  );
  assert.equal(uploadedObjects[0].payload.FilePath, "/tmp/avatar.png");
});
