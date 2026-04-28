import type { FeedCardView, FeedItem, PagedResult } from "@utils/api-types";
import { mockServiceState } from "@utils/mock-api";
import { request } from "@utils/request";

const TAB_CATEGORY_MAP: Array<"ALL" | "ADOPTION" | "BOARDING" | "HOME_FEEDING" | "SECOND_HAND"> = [
  "ALL",
  "ADOPTION",
  "BOARDING",
  "HOME_FEEDING",
  "SECOND_HAND",
];

function resolveFeedBadge(item: FeedItem) {
  if (item.badge) {
    return item.badge;
  }

  switch (item.serviceCategory) {
    case "BOARDING":
      return "宠物寄养";
    case "ADOPTION":
      return "领养";
    case "SECOND_HAND":
      return "闲置";
    default:
      return "上门喂养";
  }
}

function toFeedCardView(item: FeedItem): FeedCardView {
  return {
    id: item.id,
    title: item.title,
    summary: item.summary,
    image: item.coverImage,
    badge: resolveFeedBadge(item),
    author: item.author ?? "服务发布",
    authorAvatarUrl: item.authorAvatarUrl ?? null,
    meta: item.meta ?? `${item.city} · ${item.stats.likeCount} 赞`,
    route: item.route ?? `/pages/detail/service/index?id=${item.id}`,
    favoriteCount: item.stats.favoriteCount,
    favorited: item.viewerState.favorited,
  };
}

async function fetchServiceFeed() {
  const result = await request<PagedResult<FeedItem>>({
    method: "GET",
    path: "/posts/feed?channel=SERVICE&page=1&pageSize=10",
  });

  return result.items.map(toFeedCardView);
}

Page({
  data: {
    location: mockServiceState.location,
    title: mockServiceState.title,
    tabs: mockServiceState.tabs,
    currentTab: 0,
    tags: mockServiceState.tags,
    highlightTitle: mockServiceState.highlightTitle,
    highlightSummary: mockServiceState.highlightSummary,
    servicePosts: mockServiceState.servicePosts,
    allServicePosts: mockServiceState.servicePosts,
    isLoading: false,
  },
  onShow() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1, // 控制哪一项是选中状态
      });
    }
  },

  async onLoad() {
    this.setData({ isLoading: true });

    try {
      const allServicePosts = await fetchServiceFeed();
      this.setData({
        allServicePosts,
      });
      this.applyCurrentTab(this.data.currentTab);
    } finally {
      this.setData({ isLoading: false });
    }
  },

  switchTab(event: WechatMiniprogram.BaseEvent) {
    const { index } = event.currentTarget.dataset as { index?: number };
    const nextIndex = Number(index);
    if (!Number.isFinite(nextIndex)) {
      return;
    }

    this.setData({
      currentTab: nextIndex,
    });
    this.applyCurrentTab(nextIndex);
  },

  applyCurrentTab(tabIndex: number) {
    const category = TAB_CATEGORY_MAP[tabIndex] ?? "ALL";
    const servicePosts =
      category === "ALL"
        ? this.data.allServicePosts
        : this.data.allServicePosts.filter((item) => {
            if (category === "ADOPTION") {
              return item.badge === "领养";
            }
            if (category === "BOARDING") {
              return item.badge === "宠物寄养";
            }
            if (category === "SECOND_HAND") {
              return item.badge === "闲置";
            }
            return item.badge === "上门喂养";
          });

    this.setData({
      servicePosts,
    });
  },

  openDetail(event: WechatMiniprogram.BaseEvent) {
    const { route } = event.currentTarget.dataset as { route?: string };
    if (!route) {
      return;
    }

    wx.navigateTo({
      url: route,
    });
  },
});
