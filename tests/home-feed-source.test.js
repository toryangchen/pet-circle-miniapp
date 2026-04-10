const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("home tab does not depend on homepage mock state", () => {
  const pagePath = path.join(__dirname, "../miniprogram/pages/tabbar/home/index.ts");
  const source = fs.readFileSync(pagePath, "utf8");

  assert.equal(source.includes("mockHomeState"), false);
});

test("home tab reads feed directly from the page source", () => {
  const pagePath = path.join(__dirname, "../miniprogram/pages/tabbar/home/index.ts");
  const source = fs.readFileSync(pagePath, "utf8");

  assert.equal(source.includes('/posts/feed?channel=PET_SOCIAL&page=1&pageSize=10'), true);
  assert.equal(source.includes("withFallback"), false);
});
