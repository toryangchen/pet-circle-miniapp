const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function readMiniappFile(filePath) {
  return fs.readFileSync(path.join(__dirname, "../miniprogram", filePath), "utf8");
}

test("message tab loads notifications from API and supports read actions", () => {
  const source = readMiniappFile("pages/tabbar/message/index.ts");

  assert.equal(source.includes("MOCK_NOTIFICATIONS"), false);
  assert.equal(source.includes('path: "/notifications"'), true);
  assert.equal(source.includes('path: "/notifications/read-all"'), true);
  assert.equal(source.includes('path: `/notifications/${notificationId}/read`'), true);
  assert.equal(source.includes("NotificationListResult"), true);
});

test("message notifications route contact events to conversation detail", () => {
  const source = readMiniappFile("pages/tabbar/message/index.ts");

  assert.equal(source.includes("CONTACT_REQUEST"), true);
  assert.equal(source.includes("CONTACT_APPROVED"), true);
  assert.equal(
    source.includes("`/pages/detail/conversation/index?id=${item.conversationId}&peerName=${peerName}`"),
    true,
  );
  assert.equal(source.includes("`/pages/detail/pet-social/index?id=${item.post.id}`"), true);
});

test("conversation detail page is registered and uses controlled conversation APIs", () => {
  const appJson = readMiniappFile("app.json");
  const source = readMiniappFile("pages/detail/conversation/index.ts");
  const wxml = readMiniappFile("pages/detail/conversation/index.wxml");

  assert.equal(appJson.includes("pages/detail/conversation/index"), true);
  assert.equal(source.includes("ConversationDetail"), true);
  assert.equal(source.includes("`/conversations/${conversationId}`"), true);
  assert.equal(source.includes("`/conversations/${conversationId}/approve`"), true);
  assert.equal(source.includes('"同意"'), true);
  assert.equal(wxml.includes("input"), false);
});

test("service detail contact request navigates to conversation detail", () => {
  const source = readMiniappFile("pages/detail/pet-social/index.ts");

  assert.equal(
    source.includes("`/pages/detail/conversation/index?id=${result.conversationId}&peerName=${peerName}`"),
    true,
  );
});
