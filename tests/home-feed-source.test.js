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

  assert.equal(
    source.includes("path: `/posts/feed?channel=PET_SOCIAL&page=${page}&pageSize=${pageSize}`"),
    true,
  );
  assert.equal(source.includes("withFallback"), false);
});

test("home tab manages paged loading state in the page source", () => {
  const pagePath = path.join(__dirname, "../miniprogram/pages/tabbar/home/index.ts");
  const source = fs.readFileSync(pagePath, "utf8");

  assert.equal(source.includes("page: 1"), true);
  assert.equal(source.includes("pageSize: 10"), true);
  assert.equal(source.includes("hasMore: true"), true);
  assert.equal(source.includes("isLoadingMore: false"), true);
  assert.equal(source.includes("async onReachBottom()"), true);
  assert.equal(source.includes("const nextPage = (this.data.page as number) + 1"), true);
  assert.equal(source.includes("bindscrolltolower"), false);
});

test("home tab caches tapped feed card for pet social detail prefill", () => {
  const pagePath = path.join(__dirname, "../miniprogram/pages/tabbar/home/index.ts");
  const templatePath = path.join(__dirname, "../miniprogram/pages/tabbar/home/index.wxml");
  const source = fs.readFileSync(pagePath, "utf8");
  const template = fs.readFileSync(templatePath, "utf8");

  assert.equal(source.includes('from "@utils/detail-prefill"'), true);
  assert.equal(source.includes("setPetSocialDetailPrefill("), true);
  assert.equal(source.includes("wx.setStorageSync(PET_SOCIAL_DETAIL_PREFILL_KEY"), false);
  assert.equal(source.includes("prefillPetSocialDetail(event.currentTarget.dataset.postId"), true);
  assert.equal(template.includes('data-post-id="{{item.id}}"'), true);
});

test("home tab feed cards do not render open-container shadows", () => {
  const pagePath = path.join(__dirname, "../miniprogram/pages/tabbar/home/index.ts");
  const source = fs.readFileSync(pagePath, "utf8");

  assert.equal(source.includes("closedElevation: 0"), true);
  assert.equal(source.includes("openElevation: 0"), true);
  assert.equal(source.includes("closedElevation: 1"), false);
  assert.equal(source.includes("openElevation: 4"), false);
});
