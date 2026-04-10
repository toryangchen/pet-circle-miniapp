import type { FeedCardView, FeedItem, PagedResult } from "@utils/api-types";
import { request } from "@utils/request";

const HOME_PAGE_COPY = {
  location: "西安",
  title: "宠友圈",
  heroTitle: "把你家毛孩子的日常，发到附近宠友都能看到的社区里",
  heroSummary: "真实分享、附近互动、同城交流，首页现在直接读取线上宠友圈列表。",
  tags: ["同城分享", "宠物日常", "邻里互动"],
};

const INITIAL_HOME_FEED: FeedCardView[] = [];

function toFeedCardView(item: FeedItem): FeedCardView {
  return {
    id: item.id,
    title: item.title,
    summary: item.summary,
    image: item.coverImage,
    badge: "宠物圈",
    author: item.author ?? "宠友分享",
    meta: item.meta ?? `${item.city} · ${item.stats.commentCount} 评论`,
    route: item.route ?? `/pages/detail/pet-social/index?id=${item.id}`,
  };
}

async function fetchHomeFeed() {
  const result = await request<PagedResult<FeedItem>>({
    method: "GET",
    path: "/posts/feed?channel=PET_SOCIAL&page=1&pageSize=10",
  });

  return result.items.map(toFeedCardView);
}

Page({
  data: {
    location: HOME_PAGE_COPY.location,
    title: HOME_PAGE_COPY.title,
    heroTitle: HOME_PAGE_COPY.heroTitle,
    heroSummary: HOME_PAGE_COPY.heroSummary,
    tags: HOME_PAGE_COPY.tags,
    featuredPosts: INITIAL_HOME_FEED,
    isLoading: false,
  },
  onShow() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0, // 控制哪一项是选中状态
      });
    }
  },

  async onLoad() {
    this.setData({ isLoading: true });

    try {
      const featuredPosts = await fetchHomeFeed();
      this.setData({
        location: HOME_PAGE_COPY.location,
        title: HOME_PAGE_COPY.title,
        heroTitle: HOME_PAGE_COPY.heroTitle,
        heroSummary: HOME_PAGE_COPY.heroSummary,
        tags: HOME_PAGE_COPY.tags,
        featuredPosts,
      });
    } finally {
      this.setData({ isLoading: false });
    }
  },

  onTapPost(event: WechatMiniprogram.BaseEvent) {
    const { route } = event.currentTarget.dataset as { route?: string };
    if (!route) {
      return;
    }

    wx.navigateTo({
      url: route,
    });
  },
});
