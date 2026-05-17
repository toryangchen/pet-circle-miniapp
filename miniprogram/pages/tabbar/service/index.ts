import type { FeedCardView, FeedItem, PagedResult } from "@utils/api-types";
import { request } from "@utils/request";
import { rpx2px } from "@utils/util";

type ServiceFeedCardView = FeedCardView & {
  serviceCategory: FeedItem["serviceCategory"];
};

const SERVICE_PAGE_COPY = {
  location: "西安",
  title: "服务",
  tabs: ["全部", "领养", "寄养", "喂养", "闲置"],
  tags: ["领养互助", "寄养照看", "同城闲置"],
  highlightTitle: "找靠谱宠物服务，先看真实发布",
  highlightSummary: "服务页直接读取线上服务列表，按领养、寄养、上门喂养和闲置分类浏览。",
};

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

function toFeedCardView(item: FeedItem): ServiceFeedCardView {
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
    serviceCategory: item.serviceCategory,
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
    location: SERVICE_PAGE_COPY.location,
    title: SERVICE_PAGE_COPY.title,
    tabs: SERVICE_PAGE_COPY.tabs,
    currentTab: 0,
    tags: SERVICE_PAGE_COPY.tags,
    highlightTitle: SERVICE_PAGE_COPY.highlightTitle,
    highlightSummary: SERVICE_PAGE_COPY.highlightSummary,
    servicePosts: [] as ServiceFeedCardView[],
    allServicePosts: [] as ServiceFeedCardView[],
    isLoading: false,
    gap: rpx2px(10),
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
    const allServicePosts = this.data.allServicePosts as ServiceFeedCardView[];
    const servicePosts =
      category === "ALL"
        ? allServicePosts
        : allServicePosts.filter((item) => item.serviceCategory === category);

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
