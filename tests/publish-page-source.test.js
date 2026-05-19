const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, "..", "miniprogram", relativePath), "utf8");
}

function cssBlock(source, selector) {
  const start = source.indexOf(`${selector} {`);
  assert.notEqual(start, -1);
  const end = source.indexOf("\n}", start);
  assert.notEqual(end, -1);
  return source.slice(start, end);
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

  assert.equal(source.includes("ensurePhoneAuthorized"), false);
  assert.equal(source.includes("bootstrapSession"), false);
  assert.equal(source.includes("submitPublishDraft"), false);
  assert.equal(source.includes("requestWithAuth"), true);
  assert.equal(source.includes("uploadImageToCos"), true);
  assert.equal(source.includes("wx.compressImage"), true);
  assert.equal(source.includes("wx.showActionSheet"), true);
  assert.equal(source.includes("kind: \"post-image\""), true);
  assert.equal(source.includes("images: uploadedImages.map((item) => item.url)"), true);
  assert.equal(source.includes('title: "发布成功"'), true);
  assert.equal(source.includes('const HOME_FEED_REFRESH_FLAG = "home_feed_needs_refresh";'), true);
  assert.equal(source.includes("wx.setStorageSync(HOME_FEED_REFRESH_FLAG, true);"), true);
  assert.equal(source.includes('url: "/pages/tabbar/home/index"'), true);
});

test("home page consumes one-time refresh marker on show", () => {
  const source = read("pages/tabbar/home/index.ts");

  assert.equal(source.includes('const HOME_FEED_REFRESH_FLAG = "home_feed_needs_refresh";'), true);
  assert.equal(source.includes("wx.getStorageSync(HOME_FEED_REFRESH_FLAG)"), true);
  assert.equal(source.includes("wx.removeStorageSync(HOME_FEED_REFRESH_FLAG);"), true);
  assert.equal(source.includes("await this.reloadHomeFeed();"), true);
});

test("home page supports pull down refresh", () => {
  const jsonSource = read("pages/tabbar/home/index.json");
  const wxmlSource = read("pages/tabbar/home/index.wxml");
  const tsSource = read("pages/tabbar/home/index.ts");

  assert.equal(jsonSource.includes('"enablePullDownRefresh": true'), false);
  assert.equal(wxmlSource.includes('refresher-enabled="{{true}}"'), true);
  assert.equal(wxmlSource.includes('refresher-triggered="{{isRefreshing}}"'), true);
  assert.equal(wxmlSource.includes('refresher-default-style="none"'), true);
  assert.equal(wxmlSource.includes('refresher-background="transparent"'), true);
  assert.equal(wxmlSource.includes('bindrefresherrefresh="onRefresherRefresh"'), true);
  assert.equal(tsSource.includes("async onRefresherRefresh()"), true);
  assert.equal(tsSource.includes("isRefreshing: true"), true);
  assert.equal(tsSource.includes("isRefreshing: false"), true);
  assert.equal(tsSource.includes("await this.reloadHomeFeed();"), true);
  assert.equal(tsSource.includes("wx.stopPullDownRefresh();"), false);
});

test("home page loading indicator uses animated dots", () => {
  const wxmlSource = read("pages/tabbar/home/index.wxml");
  const lessSource = read("pages/tabbar/home/index.less");

  assert.equal(wxmlSource.includes("内容加载中"), true);
  assert.equal(wxmlSource.includes('class="top-loading"'), true);
  assert.equal(wxmlSource.includes('class="bottom-loading__dots"'), true);
  assert.equal(wxmlSource.includes('class="bottom-loading__dot"'), true);
  assert.equal(lessSource.includes(".top-loading"), true);
  assert.equal(lessSource.includes(".bottom-loading__dot"), true);
  assert.equal(lessSource.includes("@keyframes home-loading-dot"), true);
  assert.equal(lessSource.includes("animation-delay: 0.2s;"), true);
  assert.equal(lessSource.includes("animation-delay: 0.4s;"), true);
});

test("publish page template renders editable local form shell", () => {
  const source = read("pages/publish/index.wxml");

  assert.equal(source.includes('<navigation-bar back title="发布" background="#ffffff"></navigation-bar>'), true);
  assert.equal(source.includes('<scroll-view class="publish-scroll" scroll-y enhanced show-scrollbar="{{false}}">'), false);
  assert.equal(source.includes('class="publish-image-grid"'), true);
  assert.equal(source.includes('bindtap="handleImageTap"'), true);
  assert.equal(source.includes('catchtap="removeImage"'), true);
  assert.equal(source.includes('bindlongpress="startImageDrag"'), true);
  assert.equal(source.includes('catchtouchmove="onImageDragMove"'), true);
  assert.equal(source.includes('bindtouchend="finishImageDrag"'), true);
  assert.equal(source.includes('placeholder="添加标题"'), true);
  assert.equal(source.includes('maxlength="30"\n        auto-height'), true);
  assert.equal(source.includes('placeholder="添加正文或发语音"'), true);
  assert.equal(source.includes('maxlength="500"\n        auto-height'), false);
  assert.equal(source.includes('wx:if="{{currentTab !== \'PET_SOCIAL\'}}"'), true);
  assert.equal(source.includes('bindtap="openFieldDialog"'), true);
  assert.equal(source.includes('bindinput="handleDialogFieldInput"'), true);
  assert.equal(source.includes('bindchange="handleFieldPickerChange"'), true);
  assert.equal(source.includes('wx:if="{{item.inputType === \'picker\'}}"'), true);
  assert.equal(source.includes('class="publish-field-dialog__mask"'), false);
  assert.equal(source.includes('src="/assets/icon-arrow-right.png"'), true);
  assert.equal(source.includes("publish-field-editor"), true);
  assert.equal(source.includes('class="publish-footer__button {{isPublishEnabled ? \'publish-footer__button--enabled\' : \'publish-footer__button--disabled\'}}"'), true);
});

test("publish page field text editor follows comment route bottom input pattern", () => {
  const wxmlSource = read("pages/publish/index.wxml");
  const lessSource = read("pages/publish/index.less");
  const tsSource = read("pages/publish/index.ts");

  assert.equal(wxmlSource.includes('class="publish-field-editor"'), true);
  assert.equal(wxmlSource.includes('bindtap="dismissFieldEditor"'), true);
  assert.equal(wxmlSource.includes('catchtap="noop"'), true);
  assert.equal(wxmlSource.includes('style="bottom: {{fieldEditorKeyboardHeight}}px"'), true);
  assert.equal(wxmlSource.includes('focus="{{fieldEditorInputFocused}}"'), true);
  assert.equal(wxmlSource.includes("auto-focus"), true);
  assert.equal(wxmlSource.includes('adjust-position="{{false}}"'), true);
  assert.equal(wxmlSource.includes('bindkeyboardheightchange="onFieldEditorKeyboardHeightChange"'), true);
  assert.equal(wxmlSource.includes('wx:if="{{canConfirmFieldEditor}}"'), true);
  assert.equal(wxmlSource.includes('bindtap="confirmFieldEditor"'), true);
  assert.equal(wxmlSource.includes("publish-field-dialog__panel"), false);

  assert.equal(lessSource.includes(".publish-field-editor {"), true);
  assert.equal(lessSource.includes(".publish-field-editor__panel"), true);
  assert.equal(lessSource.includes("transition: bottom 0.08s ease-out;"), true);
  assert.equal(lessSource.includes(".publish-field-dialog__panel"), false);

  assert.equal(tsSource.includes("fieldEditorKeyboardHeight: 0"), true);
  assert.equal(tsSource.includes("fieldEditorInputFocused: false"), true);
  assert.equal(tsSource.includes("canConfirmFieldEditor: false"), true);
  assert.equal(tsSource.includes("onFieldEditorKeyboardHeightChange"), true);
  assert.equal(tsSource.includes("dismissFieldEditor"), true);
  assert.equal(tsSource.includes("confirmFieldEditor"), true);
  assert.equal(tsSource.includes("closeFieldDialog"), false);
});

test("publish page structured form rows use larger text", () => {
  const source = read("pages/publish/index.less");

  assert.equal(cssBlock(source, ".publish-field-row__label").includes("font-size: 26rpx;"), true);
  assert.equal(cssBlock(source, ".publish-field-row__value").includes("font-size: 24rpx;"), true);
});

test("publish page limits images and tracks upload state", () => {
  const source = read("pages/publish/index.ts");

  assert.equal(source.includes("const MAX_UPLOAD_IMAGES = 3;"), true);
  assert.equal(source.includes("imageList"), true);
  assert.equal(source.includes("uploadStatus"), true);
  assert.equal(source.includes("wx.chooseMedia"), true);
  assert.equal(source.includes("wx.chooseImage"), false);
  assert.equal(source.includes("count: remainingCount"), true);
  assert.equal(source.includes("const latestImageList = this.data.imageList as PublishImageItem[];"), true);
  assert.equal(source.includes("[...latestImageList, ...nextItems].slice(0, MAX_UPLOAD_IMAGES)"), true);
  assert.equal(source.includes("最多上传3张图片"), true);
  assert.equal(source.includes("startImageDrag"), true);
  assert.equal(source.includes("finishImageDrag"), true);
});

test("publish page footer styles use muted disabled treatment", () => {
  const source = read("pages/publish/index.less");

  assert.equal(source.includes(".publish-footer"), true);
  assert.equal(source.includes(".publish-footer__button--disabled"), true);
  assert.equal(source.includes("background-color: #40a200 !important;"), true);
  assert.equal(source.includes("color: #ffffff !important;"), true);
  assert.equal(source.includes("opacity: 0.6;"), true);
  assert.equal(source.includes(".publish-field-row__arrow-icon"), true);
  assert.equal(source.includes("max-height: 360rpx;"), true);
  assert.equal(source.includes("font-size: 32rpx;"), true);
  assert.equal(source.includes("font-size: 28rpx;"), true);
  assert.equal(source.includes("calc((100% - 24rpx) / 3)"), true);
});
