const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("pet social detail prefill uses process memory", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "../miniprogram/utils/detail-prefill.ts"),
    "utf8",
  );

  assert.equal(source.includes("let petSocialDetailPrefill"), true);
  assert.equal(source.includes("setPetSocialDetailPrefill"), true);
  assert.equal(source.includes("consumePetSocialDetailPrefill"), true);
  assert.equal(source.includes("const prefill = petSocialDetailPrefill"), true);
  assert.equal(source.includes("petSocialDetailPrefill = null"), true);
  assert.equal(source.includes("return prefill"), true);
  assert.equal(source.includes("wx.setStorageSync"), false);
  assert.equal(source.includes("wx.getStorageSync"), false);
});
