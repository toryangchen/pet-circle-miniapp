const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, "..", "miniprogram", relativePath), "utf8");
}

test("publish page uses local-only four-tab form state", () => {
  const source = read("pages/publish/index.ts");

  assert.equal(source.includes('type PublishTab = "PET_SOCIAL" | "FOSTER" | "HOME_VISIT" | "RESALE";'), true);
  assert.equal(source.includes('currentTab: "PET_SOCIAL" as PublishTab'), true);
  assert.equal(source.includes('{ key: "PET_SOCIAL", label: "#宠物圈" }'), true);
  assert.equal(source.includes('{ key: "FOSTER", label: "#寄养领养" }'), true);
  assert.equal(source.includes('{ key: "HOME_VISIT", label: "#上门喂养" }'), true);
  assert.equal(source.includes('{ key: "RESALE", label: "#二手闲置" }'), true);
  assert.equal(source.includes("fieldGroups"), true);
  assert.equal(source.includes("isFieldDialogVisible"), true);
  assert.equal(source.includes("isPublishEnabled"), true);
});

test("publish page no longer depends on auth or request helpers", () => {
  const source = read("pages/publish/index.ts");

  assert.equal(source.includes("requestWithAuth"), false);
  assert.equal(source.includes("ensurePhoneAuthorized"), false);
  assert.equal(source.includes("bootstrapSession"), false);
  assert.equal(source.includes("submitPublishDraft"), false);
  assert.equal(source.includes('title: "界面预览版，暂未接入发布"'), true);
});

test("publish page template renders editable local form shell", () => {
  const source = read("pages/publish/index.wxml");

  assert.equal(source.includes('<navigation-bar back title="发布" background="#ffffff"></navigation-bar>'), true);
  assert.equal(source.includes('<scroll-view class="publish-scroll" scroll-y enhanced show-scrollbar="{{false}}">'), false);
  assert.equal(source.includes('placeholder="添加标题"'), true);
  assert.equal(source.includes('placeholder="添加正文或发语音"'), true);
  assert.equal(source.includes('maxlength="500"\n        auto-height'), false);
  assert.equal(source.includes('wx:if="{{currentTab !== \'PET_SOCIAL\'}}"'), true);
  assert.equal(source.includes('bindtap="openFieldDialog"'), true);
  assert.equal(source.includes('bindinput="handleDialogFieldInput"'), true);
  assert.equal(source.includes('bindchange="handleFieldPickerChange"'), true);
  assert.equal(source.includes('wx:if="{{item.inputType === \'picker\'}}"'), true);
  assert.equal(source.includes('class="publish-field-dialog__mask"'), true);
  assert.equal(source.includes('src="/assets/icon-arrow-right.png"'), true);
  assert.equal(source.includes("publish-field-editor"), false);
});

test("publish page footer styles use muted disabled treatment", () => {
  const source = read("pages/publish/index.less");

  assert.equal(source.includes(".publish-footer__tip"), true);
  assert.equal(source.includes("color: #a2978c;"), true);
  assert.equal(source.includes("font-size: 22rpx;"), true);
  assert.equal(source.includes(".publish-footer__button--disabled"), true);
  assert.equal(source.includes("background-color: #40a200 !important;"), true);
  assert.equal(source.includes("color: #ffffff !important;"), true);
  assert.equal(source.includes("opacity: 0.6;"), true);
  assert.equal(source.includes(".publish-field-row__arrow-icon"), true);
  assert.equal(source.includes("max-height: 360rpx;"), true);
});
