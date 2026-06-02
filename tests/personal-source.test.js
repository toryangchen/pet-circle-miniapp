const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const personalPath = path.join(__dirname, "../miniprogram/pages/tabbar/personal/index.ts");
const personalWxmlPath = path.join(__dirname, "../miniprogram/pages/tabbar/personal/index.wxml");
const personalJsonPath = path.join(__dirname, "../miniprogram/pages/tabbar/personal/index.json");
const personalLessPath = path.join(__dirname, "../miniprogram/pages/tabbar/personal/index.less");
const source = fs.readFileSync(personalPath, "utf8");
const wxmlSource = fs.readFileSync(personalWxmlPath, "utf8");
const jsonSource = fs.readFileSync(personalJsonPath, "utf8");
const lessSource = fs.readFileSync(personalLessPath, "utf8");

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
  assert.match(source, /tabs: \["发布", "收藏", "浏览"\]/);
});

test("personal page uses scroll-view driven header opacity state", () => {
  assert.match(source, /onScroll\(event: WechatMiniprogram\.ScrollViewScroll\)/);
  assert.match(source, /opacityRate: rate >= 1 \? 1 : rate/);
  assert.match(wxmlSource, /bindscroll="onScroll"/);
  assert.match(wxmlSource, /sticky-section/);
});

test("personal page renders my posts with the shared feed card", () => {
  assert.equal(jsonSource.includes('"feed-card": "/components/feed-card/index"'), true);
  assert.equal(
    wxmlSource.includes('<feed-card item="{{item}}" show-badge="{{true}}"></feed-card>'),
    true,
  );
  assert.equal(
    wxmlSource.includes("wx:elif=\"{{activeTab === '发布' && posts.length > 0}}\""),
    true,
  );
  assert.equal(wxmlSource.includes('bindtap="openPostDetail"'), true);
});

test("personal page renders publish, favorite, and history card grids directly", () => {
  assert.equal(wxmlSource.includes("activeTab === '发布' && posts.length > 0"), true);
  assert.equal(wxmlSource.includes("activeTab === '收藏' && favoritePosts.length > 0"), true);
  assert.equal(wxmlSource.includes("activeTab === '浏览' && historyPosts.length > 0"), true);
  assert.equal(
    wxmlSource.includes('<feed-card item="{{item}}" show-badge="{{true}}"></feed-card>'),
    true,
  );
});

test("personal publish grid is a direct sticky-section child for Skyline rendering", () => {
  assert.equal(wxmlSource.includes('<list-view>\n      <view class="personal-panel">'), false);
  assert.equal(wxmlSource.includes('class="personal-panel personal-post-grid"'), true);
});

test("personal page uses the card background as the page fallback color", () => {
  assert.match(lessSource, /page\s*\{\s*background: #fffdfc;\s*\}/);
});

test("personal page hides bottom reached copy on the first page", () => {
  assert.equal(
    wxmlSource.includes("activeTab === '发布' && !hasMore && page > 1 && posts.length > 0"),
    true,
  );
  assert.equal(
    wxmlSource.includes(
      "activeTab === '收藏' && !favoriteHasMore && favoritePage > 1 && favoritePosts.length > 0",
    ),
    true,
  );
  assert.equal(
    wxmlSource.includes(
      "activeTab === '浏览' && !historyHasMore && historyPage > 1 && historyPosts.length > 0",
    ),
    true,
  );
});

test("personal page shows tab-specific initial loading before empty states", () => {
  assert.equal(
    wxmlSource.includes("activeTab === '发布' && isLoadingPosts && posts.length === 0"),
    true,
  );
  assert.equal(
    wxmlSource.includes("activeTab === '收藏' && isLoadingFavorites && favoritePosts.length === 0"),
    true,
  );
  assert.equal(
    wxmlSource.includes("activeTab === '浏览' && isLoadingHistory && historyPosts.length === 0"),
    true,
  );
  assert.equal(wxmlSource.includes('class="personal-panel pc-grid-loading"'), true);
  assert.equal(wxmlSource.includes('class="pc-grid-skeleton"'), true);
  assert.equal(source.includes("isLoadingFavorites: true"), true);
  assert.equal(source.includes("isLoadingHistory: true"), true);
});

test("personal page loads and refreshes my published posts", () => {
  assert.equal(
    source.includes('const PERSONAL_POSTS_REFRESH_FLAG = "personal_posts_needs_refresh";'),
    true,
  );
  assert.equal(source.includes("path: `/posts/my?page=${page}&pageSize=${pageSize}`"), true);
  assert.equal(source.includes("void this.reloadPosts();"), true);
  assert.equal(source.includes("wx.getStorageSync(PERSONAL_POSTS_REFRESH_FLAG)"), true);
  assert.equal(source.includes("wx.removeStorageSync(PERSONAL_POSTS_REFRESH_FLAG);"), true);
});

test("personal page loads favorites and browsing history from real endpoints", () => {
  assert.equal(source.includes("path: `/favorites/my?page=${page}&pageSize=${pageSize}`"), true);
  assert.equal(source.includes("path: `/posts/history?page=${page}&pageSize=${pageSize}`"), true);
  assert.equal(source.includes('case "收藏":'), true);
  assert.equal(source.includes('case "浏览":'), true);
});

test("personal page tolerates legacy my-post fields while rendering cards", () => {
  assert.equal(source.includes("summary: item.summary || resolveStatusSummary(item)"), true);
  assert.equal(source.includes("favoriteCount: item.stats?.favoriteCount ?? 0"), true);
  assert.equal(source.includes("favorited: item.viewerState?.favorited ?? false"), true);
});
