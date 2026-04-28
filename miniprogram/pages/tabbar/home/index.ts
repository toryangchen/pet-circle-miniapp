import type { FeedCardView, FeedItem, PagedResult } from "@utils/api-types";
import { request } from "@utils/request";
import { rpx2px } from "@utils/util";

const HOME_FEED_REFRESH_FLAG = "home_feed_needs_refresh";

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
    authorAvatarUrl: item.authorAvatarUrl ?? null,
    route: item.route ?? `/pages/detail/pet-social/index?id=${item.id}`,
    favoriteCount: item.stats.favoriteCount,
    favorited: item.viewerState.favorited,
  };
}

async function fetchHomeFeed(page: number, pageSize: number) {
  const result = await request<PagedResult<FeedItem>>({
    method: "GET",
    path: `/posts/feed?channel=PET_SOCIAL&page=${page}&pageSize=${pageSize}`,
  });

  return {
    ...result,
    items: result.items.map(toFeedCardView),
  };
}

Page({
  data: {
    location: HOME_PAGE_COPY.location,
    title: HOME_PAGE_COPY.title,
    heroTitle: HOME_PAGE_COPY.heroTitle,
    heroSummary: HOME_PAGE_COPY.heroSummary,
    tags: HOME_PAGE_COPY.tags,
    featuredPosts: INITIAL_HOME_FEED,

    type: "fade",
    duration: 300,
    closedElevation: 1,
    closedBorderRadius: 4,
    openElevation: 4,
    openBorderRadius: 0,

    page: 1,
    pageSize: 10,
    hasMore: true,
    isLoading: false,
    isLoadingMore: false,
    isRefreshing: false,
    gap: rpx2px(10),
  },
  async onShow() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0, // 控制哪一项是选中状态
      });
    }

    if (wx.getStorageSync(HOME_FEED_REFRESH_FLAG)) {
      wx.removeStorageSync(HOME_FEED_REFRESH_FLAG);
      await this.reloadHomeFeed();
    }
  },

  async onLoad() {
    await this.reloadHomeFeed();
  },

  async onRefresherRefresh() {
    if (this.data.isRefreshing) {
      return;
    }

    this.setData({
      isRefreshing: true,
    });

    try {
      await this.reloadHomeFeed();
    } finally {
      this.setData({
        isRefreshing: false,
      });
    }
  },

  async onReachBottom() {
    await this.loadNextPage();
  },

  async onScrollToLower() {
    await this.loadNextPage();
  },

  async reloadHomeFeed() {
    this.setData({ isLoading: true });

    try {
      const page = 1;
      const pageSize = this.data.pageSize as number;
      const result = await fetchHomeFeed(page, pageSize);
      this.setData({
        location: HOME_PAGE_COPY.location,
        title: HOME_PAGE_COPY.title,
        heroTitle: HOME_PAGE_COPY.heroTitle,
        heroSummary: HOME_PAGE_COPY.heroSummary,
        tags: HOME_PAGE_COPY.tags,
        featuredPosts: result.items,
        page,
        hasMore: result.hasMore,
      });
    } finally {
      this.setData({ isLoading: false });
    }
  },

  async loadNextPage() {
    if (this.data.isLoading || this.data.isLoadingMore || !this.data.hasMore) {
      return;
    }

    const nextPage = (this.data.page as number) + 1;
    const pageSize = this.data.pageSize as number;

    this.setData({
      isLoadingMore: true,
    });

    try {
      const result = await fetchHomeFeed(nextPage, pageSize);
      this.setData({
        featuredPosts: [...(this.data.featuredPosts as FeedCardView[]), ...result.items],
        page: nextPage,
        hasMore: result.hasMore,
      });
    } finally {
      this.setData({
        isLoadingMore: false,
      });
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
