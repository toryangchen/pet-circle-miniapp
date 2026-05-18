const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function readPageSource(relativePath) {
  return fs.readFileSync(path.join(__dirname, "..", "miniprogram", relativePath), "utf8");
}

test("page files do not import aggregated api module", () => {
  const pageFiles = [
    "pages/tabbar/home/index.ts",
    "pages/tabbar/service/index.ts",
    "pages/detail/pet-social/index.ts",
    "pages/publish/index.ts",
  ];

  for (const file of pageFiles) {
    const source = readPageSource(file);
    assert.equal(
      source.includes('from "@utils/api"'),
      false,
      `${file} should not import @utils/api`,
    );
  }
});

test("legacy service detail page is no longer registered or routed to", () => {
  const appJson = readPageSource("app.json");
  const messageSource = readPageSource("pages/tabbar/message/index.ts");
  const mockApiSource = readPageSource("utils/mock-api.ts");
  const mockSource = readPageSource("utils/mock.ts");

  assert.equal(appJson.includes("pages/detail/service/index"), false);
  assert.equal(messageSource.includes("/pages/detail/service/index"), false);
  assert.equal(mockApiSource.includes("/pages/detail/service/index"), false);
  assert.equal(mockSource.includes("/pages/detail/service/index"), false);
});

test("tab pages show feed request urls inline", () => {
  const homeSource = readPageSource("pages/tabbar/home/index.ts");
  const serviceSource = readPageSource("pages/tabbar/service/index.ts");

  assert.equal(
    homeSource.includes("path: `/posts/feed?channel=PET_SOCIAL&page=${page}&pageSize=${pageSize}`"),
    true,
  );
  assert.equal(
    serviceSource.includes("path: `/posts/feed?channel=SERVICE&page=${page}&pageSize=${pageSize}`"),
    true,
  );
});

test("base request helper requires login before sending page requests", () => {
  const requestSource = readPageSource("utils/request.ts");

  assert.equal(requestSource.includes("return requestWithAuth<T>(options);"), true);
});
