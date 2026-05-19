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
  assert.equal(template.includes('data-post-id="{{post.id}}"'), true);
});

test("service tab opens cards with the same open-container pattern as home", () => {
  const pagePath = path.join(__dirname, "../miniprogram/pages/tabbar/service/index.ts");
  const templatePath = path.join(__dirname, "../miniprogram/pages/tabbar/service/index.wxml");
  const source = fs.readFileSync(pagePath, "utf8");
  const template = fs.readFileSync(templatePath, "utf8");

  assert.equal(template.includes("<open-container"), true);
  assert.equal(template.includes('closed-elevation="{{closedElevation}}"'), true);
  assert.equal(template.includes('closed-border-radius="{{closedBorderRadius}}"'), true);
  assert.equal(template.includes('open-elevation="{{openElevation}}"'), true);
  assert.equal(template.includes('open-border-radius="{{openBorderRadius}}"'), true);
  assert.equal(template.includes('transition-type="{{type}}"'), true);
  assert.equal(template.includes('transition-duration="{{duration}}"'), true);
  assert.equal(template.includes('bindtap="openDetail"'), true);
  assert.equal(source.includes('type: "fade"'), true);
  assert.equal(source.includes("duration: 300"), true);
  assert.equal(source.includes("closedElevation: 0"), true);
  assert.equal(source.includes("closedBorderRadius: 4"), true);
  assert.equal(source.includes("openElevation: 0"), true);
  assert.equal(source.includes("openBorderRadius: 0"), true);
  assert.equal(source.includes("closedElevation: 1"), false);
  assert.equal(source.includes("openElevation: 4"), false);
});

test("service tab supports pull refresh and paged load more like home", () => {
  const pagePath = path.join(__dirname, "../miniprogram/pages/tabbar/service/index.ts");
  const templatePath = path.join(__dirname, "../miniprogram/pages/tabbar/service/index.wxml");
  const stylesPath = path.join(__dirname, "../miniprogram/pages/tabbar/service/index.less");
  const source = fs.readFileSync(pagePath, "utf8");
  const template = fs.readFileSync(templatePath, "utf8");
  const styles = fs.readFileSync(stylesPath, "utf8");

  assert.equal(
    source.includes("path: `/posts/feed?channel=SERVICE&page=${page}&pageSize=${pageSize}`"),
    true,
  );
  assert.equal(source.includes("page: 1"), true);
  assert.equal(source.includes("pageSize: 10"), true);
  assert.equal(source.includes("hasMore: true"), true);
  assert.equal(source.includes("isLoadingMore: false"), true);
  assert.equal(source.includes("isRefreshing: false"), true);
  assert.equal(source.includes("async onRefresherRefresh()"), true);
  assert.equal(source.includes("async loadNextPage()"), true);
  assert.equal(source.includes("const nextPage = (this.data.page as number) + 1"), true);
  assert.equal(source.includes("allServicePosts: [..."), true);
  assert.equal(template.includes('refresher-enabled="{{true}}"'), true);
  assert.equal(template.includes('refresher-triggered="{{isRefreshing}}"'), true);
  assert.equal(template.includes('bindrefresherrefresh="onRefresherRefresh"'), true);
  assert.equal(template.includes('bindscrolltolower="onScrollToLower"'), true);
  assert.equal(template.includes("服务内容加载中"), true);
  assert.equal(styles.includes(".top-loading"), true);
  assert.equal(styles.includes(".bottom-loading"), true);
});

test("service tab uses a measured tab indicator for category switching", () => {
  const pagePath = path.join(__dirname, "../miniprogram/pages/tabbar/service/index.ts");
  const templatePath = path.join(__dirname, "../miniprogram/pages/tabbar/service/index.wxml");
  const stylesPath = path.join(__dirname, "../miniprogram/pages/tabbar/service/index.less");
  const source = fs.readFileSync(pagePath, "utf8");
  const template = fs.readFileSync(templatePath, "utf8");
  const styles = fs.readFileSync(stylesPath, "utf8");

  assert.equal(template.includes('class="service-tabs__track"'), true);
  assert.equal(template.includes('<swiper class="service-swiper"'), true);
  assert.equal(template.includes('current="{{currentTab}}"'), true);
  assert.equal(template.includes('bindchange="onTabChanged"'), true);
  assert.equal(template.includes('<swiper-item wx:for="{{serviceTabPanels}}"'), true);
  assert.equal(template.includes('wx:for="{{panel.posts}}"'), true);
  assert.equal(template.includes('class="service-tab-indicator"'), true);
  assert.equal(template.includes("translateX({{tabIndicatorLeft}}px) scaleX(0.72)"), true);
  assert.equal(source.includes("serviceTabPanels: buildServiceTabPanels([])"), true);
  assert.equal(source.includes("tabIndicatorLeft: 0"), true);
  assert.equal(source.includes("tabIndicatorWidth: 0"), true);
  assert.equal(source.includes("updateTabIndicator(nextIndex)"), true);
  assert.equal(source.includes("onTabChanged(event:"), true);
  assert.equal(source.includes("const nextIndex = event.detail.current"), true);
  assert.equal(source.includes("buildServiceTabPanels(allServicePosts)"), true);
  assert.equal(source.includes('query.select(".service-tabs__track").boundingClientRect()'), true);
  assert.equal(source.includes('query.selectAll(".service-tab").boundingClientRect()'), true);
  assert.equal(styles.includes(".service-swiper"), true);
  assert.equal(styles.includes(".service-tab-indicator"), true);
  assert.equal(styles.includes("transition: width 220ms ease, transform 220ms ease;"), true);
});
