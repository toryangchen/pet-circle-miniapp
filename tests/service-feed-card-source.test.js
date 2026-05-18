const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("service tab does not depend on service mock state", () => {
  const pagePath = path.join(__dirname, "../miniprogram/pages/tabbar/service/index.ts");
  const source = fs.readFileSync(pagePath, "utf8");

  assert.equal(source.includes("mockServiceState"), false);
  assert.equal(source.includes('from "@utils/mock-api"'), false);
});

test("home and service tabs render feed cards through the shared component", () => {
  const homeJson = fs.readFileSync(
    path.join(__dirname, "../miniprogram/pages/tabbar/home/index.json"),
    "utf8",
  );
  const homeWxml = fs.readFileSync(
    path.join(__dirname, "../miniprogram/pages/tabbar/home/index.wxml"),
    "utf8",
  );
  const serviceJson = fs.readFileSync(
    path.join(__dirname, "../miniprogram/pages/tabbar/service/index.json"),
    "utf8",
  );
  const serviceWxml = fs.readFileSync(
    path.join(__dirname, "../miniprogram/pages/tabbar/service/index.wxml"),
    "utf8",
  );

  assert.equal(homeJson.includes('"feed-card": "/components/feed-card/index"'), true);
  assert.equal(serviceJson.includes('"feed-card": "/components/feed-card/index"'), true);
  assert.equal(homeWxml.includes("<feed-card"), true);
  assert.equal(serviceWxml.includes("<feed-card"), true);
});

test("shared feed card uses virtual host for Skyline grid measurement", () => {
  const componentSource = fs.readFileSync(
    path.join(__dirname, "../miniprogram/components/feed-card/index.ts"),
    "utf8",
  );

  assert.equal(componentSource.includes("virtualHost: true"), true);
});

test("service tab reuses pet social detail page for card taps", () => {
  const pagePath = path.join(__dirname, "../miniprogram/pages/tabbar/service/index.ts");
  const templatePath = path.join(__dirname, "../miniprogram/pages/tabbar/service/index.wxml");
  const source = fs.readFileSync(pagePath, "utf8");
  const template = fs.readFileSync(templatePath, "utf8");

  assert.equal(source.includes('from "@utils/detail-prefill"'), true);
  assert.equal(source.includes("route: `/pages/detail/pet-social/index?id=${item.id}`"), true);
  assert.equal(source.includes("setPetSocialDetailPrefill("), true);
  assert.equal(source.includes("isServiceDetail: true"), true);
  assert.equal(source.includes("prefillPetSocialDetail(event.currentTarget.dataset.postId"), true);
  assert.equal(template.includes('data-post-id="{{item.id}}"'), true);
});
