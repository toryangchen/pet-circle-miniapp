const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const personalPath = path.join(
  __dirname,
  "../miniprogram/pages/tabbar/personal/index.ts",
);
const personalWxmlPath = path.join(
  __dirname,
  "../miniprogram/pages/tabbar/personal/index.wxml",
);
const source = fs.readFileSync(personalPath, "utf8");
const wxmlSource = fs.readFileSync(personalWxmlPath, "utf8");

test("personal page loads real user info from session state and auth me", () => {
  assert.match(source, /import \{ getAuthState, syncCurrentUser \} from "@utils\/session"/);
  assert.match(source, /this\.applyUserProfile\(getAuthState\(\)\.user\)/);
  assert.match(source, /await syncCurrentUser\(\{ allowRelogin: true \}\)/);
});

test("personal page binds avatar and background to real profile data", () => {
  assert.match(source, /background: resolveBackground\(user\?\.bgType\)/);
  assert.match(source, /avatar: user\?\.avatarUrl \|\| DEFAULT_AVATAR/);
  assert.match(wxmlSource, /src="\{\{profile\.background\}\}"/);
  assert.match(wxmlSource, /src="\{\{profile\.avatar\}\}"/);
});

test("personal page shows basic user summaries from real fields", () => {
  assert.match(source, /status: formatPhoneStatus\(user\)/);
  assert.match(source, /subtitle: formatSubtitle\(user\)/);
  assert.match(source, /title: "我的收藏", summary: "还没有收藏内容"/);
  assert.match(source, /title: "我的发布", summary: "还没有发布记录"/);
});

test("personal page uses scroll-view driven header opacity state", () => {
  assert.match(source, /onScroll\(event: WechatMiniprogram\.ScrollViewScroll\)/);
  assert.match(source, /opacityRate: rate >= 1 \? 1 : rate/);
  assert.match(wxmlSource, /bindscroll="onScroll"/);
  assert.match(wxmlSource, /sticky-section/);
});
