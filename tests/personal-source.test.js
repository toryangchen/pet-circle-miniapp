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
  assert.match(source, /title: "生日", summary: formatBirthday\(user\)/);
  assert.match(source, /title: "城市", summary: formatCity\(user\)/);
});

test("personal panel becomes sticky and scrolls internally after reaching top height", () => {
  assert.match(source, /isPanelSticky: false/);
  assert.match(source, /onPageScroll\(event: \{ scrollTop: number \}\)/);
  assert.match(source, /handleInnerScrollToUpper\(\)/);
  assert.match(source, /panelStickyStartPx/);
  assert.doesNotMatch(wxmlSource, /<scroll-view[\s\S]*class="personal-scroll"/);
  assert.match(wxmlSource, /class="personal-panel \{\{isPanelSticky \? 'personal-panel--sticky' : ''\}\}"/);
  assert.match(wxmlSource, /scroll-y="\{\{isPanelSticky\}\}"/);
});
