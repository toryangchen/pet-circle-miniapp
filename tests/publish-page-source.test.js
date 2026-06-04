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

  assert.equal(
    source.includes('type PublishTab = "PET_SOCIAL" | "ADOPTION_FOSTER" | "HOME_VISIT" | "OTHER";'),
    true,
  );
  assert.equal(source.includes('currentTab: "PET_SOCIAL" as PublishTab'), true);
  assert.equal(source.includes('{ key: "PET_SOCIAL", label: "#宠物圈" }'), true);
  assert.equal(source.includes('{ key: "ADOPTION_FOSTER", label: "#领养寄养" }'), true);
  assert.equal(source.includes('{ key: "HOME_VISIT", label: "#上门喂养" }'), true);
  assert.equal(source.includes('{ key: "OTHER", label: "#其它" }'), true);
  assert.equal(source.includes("#寄养领养"), false);
  assert.equal(source.includes("#二手闲置"), false);
  assert.equal(source.includes("fieldGroups"), true);
  assert.equal(source.includes("isFieldDialogVisible"), true);
  assert.equal(source.includes("isPublishEnabled"), true);
});

test("publish page optimized service forms cover adoption boarding feeding and other needs", () => {
  const source = read("pages/publish/index.ts");

  assert.equal(source.includes('label: "需求类型"'), true);
  assert.equal(source.includes('options: ["领养", "寄养"]'), true);
  assert.equal(source.includes('label: "宠物信息"'), true);
  assert.equal(source.includes('inputType: "multiPicker"'), true);
  assert.equal(source.includes('keys: ["adoptionFosterPetType", "adoptionFosterAge", "adoptionFosterGender"]'), true);
  assert.equal(source.includes('columns: ['), true);
  assert.equal(source.includes('label: "宠物类型"'), false);
  assert.equal(source.includes('label: "年龄阶段"'), false);
  assert.equal(source.includes('label: "性别"'), false);
  assert.equal(source.includes('label: "是否绝育"'), true);
  assert.equal(source.includes('label: "费用/要求"'), true);
  assert.equal(source.includes('serviceCategory: fieldValues.adoptionFosterMode === "领养" ? "ADOPTION" : "BOARDING"'), true);
  assert.equal(source.includes("adoptionDetail:"), true);
  assert.equal(source.includes("boardingDetail:"), true);

  assert.equal(source.includes('label: "服务区域"'), true);
  assert.equal(source.includes('label: "可上门时间"'), true);
  assert.equal(source.includes('label: "服务内容"'), true);
  assert.equal(source.includes('label: "参考价格"'), true);
  assert.equal(source.includes("homeFeedingDetail:"), true);

  assert.equal(source.includes('label: "信息类型"'), true);
  assert.equal(source.includes('options: ["求助", "组局", "闲置", "其它"]'), true);
  assert.equal(source.includes('label: "所在区域"'), true);
  assert.equal(source.includes('label: "预算/价格"'), true);
  assert.equal(source.includes('label: "补充说明"'), true);
  assert.equal(source.includes('serviceCategory: "OTHER"'), true);
  assert.equal(source.includes("otherDetail:"), true);
  assert.equal(source.includes("secondHandDetail:"), false);
  assert.equal(source.includes("neuteredStatus: resolveNeuteredStatus(fieldValues.adoptionFosterNeutered)"), true);
  assert.equal(source.includes('neutered: fieldValues.adoptionFosterNeutered === "已绝育"'), false);
});

test("publish page adoption foster pet info uses one multi-column picker but stores split fields", () => {
  const wxmlSource = read("pages/publish/index.wxml");
  const tsSource = read("pages/publish/index.ts");

  assert.equal(wxmlSource.includes('mode="multiSelector"'), true);
  assert.equal(wxmlSource.includes('range="{{item.columns}}"'), true);
  assert.equal(wxmlSource.includes('value="{{item.optionIndexes}}"'), true);
  assert.equal(wxmlSource.includes('bindchange="handleFieldMultiPickerChange"'), true);
  assert.equal(wxmlSource.includes('wx:elif="{{item.inputType === \'multiPicker\'}}"'), true);

  assert.equal(tsSource.includes('type FieldInputType = "text" | "textarea" | "picker" | "multiPicker";'), true);
  assert.equal(tsSource.includes("keys?: PublishFieldKey[];"), true);
  assert.equal(tsSource.includes("columns?: string[][];"), true);
  assert.equal(tsSource.includes("optionIndexes: number[];"), true);
  assert.equal(tsSource.includes("function resolveMultiPickerValue"), true);
  assert.equal(tsSource.includes("handleFieldMultiPickerChange"), true);
  assert.equal(tsSource.includes("nextValues[key] = fieldColumns[columnIndex]?.[optionIndex] ??"), true);
  assert.equal(tsSource.includes("petType: fieldValues.adoptionFosterPetType"), true);
  assert.equal(tsSource.includes("age: fieldValues.adoptionFosterAge"), true);
  assert.equal(tsSource.includes("gender: fieldValues.adoptionFosterGender"), true);
  assert.equal(tsSource.includes("acceptedPetTypes: [fieldValues.adoptionFosterPetType]"), true);
});

test("publish page validates multi-column picker through split field keys", () => {
  const tsSource = read("pages/publish/index.ts");

  assert.equal(tsSource.includes("function isFieldComplete"), true);
  assert.equal(tsSource.includes("field.keys?.every((key) => values[key].trim())"), true);
  assert.equal(tsSource.includes("return fieldGroups[currentTab].every((field) => isFieldComplete(field, values));"), true);
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
  assert.equal(source.includes('const SERVICE_FEED_REFRESH_FLAG = "service_feed_needs_refresh";'), true);
  assert.equal(source.includes("const isServicePost = currentTab !== \"PET_SOCIAL\";"), true);
  assert.equal(source.includes("wx.setStorageSync(isServicePost ? SERVICE_FEED_REFRESH_FLAG : HOME_FEED_REFRESH_FLAG, true);"), true);
  assert.equal(source.includes('url: isServicePost ? "/pages/tabbar/service/index" : "/pages/tabbar/home/index"'), true);
});

test("home page consumes one-time refresh marker on show", () => {
  const source = read("pages/tabbar/home/index.ts");

  assert.equal(source.includes('const HOME_FEED_REFRESH_FLAG = "home_feed_needs_refresh";'), true);
  assert.equal(source.includes("wx.getStorageSync(HOME_FEED_REFRESH_FLAG)"), true);
  assert.equal(source.includes("wx.removeStorageSync(HOME_FEED_REFRESH_FLAG);"), true);
  assert.equal(source.includes("await this.reloadHomeFeed();"), true);
});

test("service page consumes one-time refresh marker on show", () => {
  const source = read("pages/tabbar/service/index.ts");

  assert.equal(source.includes('const SERVICE_FEED_REFRESH_FLAG = "service_feed_needs_refresh";'), true);
  assert.equal(source.includes("async onShow()"), true);
  assert.equal(source.includes("wx.getStorageSync(SERVICE_FEED_REFRESH_FLAG)"), true);
  assert.equal(source.includes("wx.removeStorageSync(SERVICE_FEED_REFRESH_FLAG);"), true);
  assert.equal(source.includes("await this.reloadServiceFeed();"), true);
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

test("home page refresh loading indicator uses animated dots", () => {
  const wxmlSource = read("pages/tabbar/home/index.wxml");
  const lessSource = read("pages/tabbar/home/index.less");

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
