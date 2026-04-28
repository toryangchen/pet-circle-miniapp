const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("navigation bar supports named title slot content", () => {
  const componentTs = fs.readFileSync(
    path.join(__dirname, "../miniprogram/components/navigation-bar/index.ts"),
    "utf8",
  );
  const componentWxml = fs.readFileSync(
    path.join(__dirname, "../miniprogram/components/navigation-bar/index.wxml"),
    "utf8",
  );
  const detailWxml = fs.readFileSync(
    path.join(__dirname, "../miniprogram/pages/detail/pet-social/index.wxml"),
    "utf8",
  );

  assert.equal(componentWxml.includes('<slot name="title"></slot>'), true);
  assert.equal(componentTs.includes("multipleSlots: true"), true);
  assert.equal(detailWxml.includes('slot="title"'), true);
});
