import type { FeedCardView, FeedItem, PagedResult } from "@utils/api-types";
import { setPetSocialDetailPrefill } from "@utils/detail-prefill";
import { request } from "@utils/request";
import { rpx2px } from "@utils/util";

const SERVICE_FEED_REFRESH_FLAG = "service_feed_needs_refresh";

type ServiceFeedCardView = FeedCardView & {
  serviceCategory: FeedItem["serviceCategory"];
};

type ServiceTabCategory = "ALL" | "ADOPTION_FOSTER" | "HOME_FEEDING" | "OTHER";

type ServiceTabPanel = {
  category: ServiceTabCategory;
  posts: ServiceFeedCardView[];
};

const SERVICE_PAGE_COPY = {
  location: "西安",
  title: "服务",
  tabs: ["全部", "领养寄养", "上门喂养", "其它"],
  tags: ["领养寄养", "上门喂养", "其它服务"],
  highlightTitle: "找靠谱宠物服务，先看真实发布",
  highlightSummary: "服务页直接读取线上服务列表，按领养寄养、上门喂养和其它分类浏览。",
};

const TAB_CATEGORY_MAP: ServiceTabCategory[] = [
  "ALL",
  "ADOPTION_FOSTER",
  "HOME_FEEDING",
  "OTHER",
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
    route: `/pages/detail/pet-social/index?id=${item.id}`,
    favoriteCount: item.stats.favoriteCount,
    favorited: item.viewerState.favorited,
    serviceCategory: item.serviceCategory,
  };
}

function buildPetSocialDetailPrefill(item: ServiceFeedCardView) {
  return {
    id: item.id,
    title: item.title,
    summary: item.summary,
    image: item.image,
    authorName: item.author,
    authorAvatarUrl: item.authorAvatarUrl ?? "",
    favoriteCount: item.favoriteCount,
    favorited: item.favorited,
    isServiceDetail: true,
    badge: item.badge,
    serviceDescription: item.summary,
    serviceFields: [
      { label: "服务类型", value: item.badge },
      { label: "服务区域", value: item.meta || "同城可约" },
      { label: "联系方式", value: "受控联系申请后展示" },
      { label: "联系入口", value: "需先完成手机号授权" },
    ],
    phoneAuthorized: false,
  };
}

function filterPostsByTab(posts: ServiceFeedCardView[], tabIndex: number) {
  const category = TAB_CATEGORY_MAP[tabIndex] ?? "ALL";

  if (category === "ALL") {
    return posts;
  }

  if (category === "ADOPTION_FOSTER") {
    return posts.filter(
      (item) => item.serviceCategory === "ADOPTION" || item.serviceCategory === "BOARDING",
    );
  }

  if (category === "OTHER") {
    return posts.filter((item) => item.serviceCategory === "SECOND_HAND");
  }

  return posts.filter((item) => item.serviceCategory === category);
}

function buildServiceTabPanels(posts: ServiceFeedCardView[]): ServiceTabPanel[] {
  return TAB_CATEGORY_MAP.map((category, index) => ({
    category,
    posts: filterPostsByTab(posts, index),
  }));
}

async function fetchServiceFeed(page: number, pageSize: number) {
  const result = await request<PagedResult<FeedItem>>({
    method: "GET",
    path: `/posts/feed?channel=SERVICE&page=${page}&pageSize=${pageSize}`,
  });

  return {
    ...result,
    items: result.items.map(toFeedCardView),
  };
}

Page({
  data: {
    location: SERVICE_PAGE_COPY.location,
    title: SERVICE_PAGE_COPY.title,
    tabs: SERVICE_PAGE_COPY.tabs,
    currentTab: 0,
    tabIndicatorLeft: 0,
    tabIndicatorWidth: 0,
    tags: SERVICE_PAGE_COPY.tags,
    highlightTitle: SERVICE_PAGE_COPY.highlightTitle,
    highlightSummary: SERVICE_PAGE_COPY.highlightSummary,
    servicePosts: [] as ServiceFeedCardView[],
    allServicePosts: [] as ServiceFeedCardView[],
    serviceTabPanels: buildServiceTabPanels([]),

    type: "fade",
    duration: 300,
    closedElevation: 0,
    closedBorderRadius: 4,
    openElevation: 0,
    openBorderRadius: 0,

    isLoading: false,
    isLoadingMore: false,
    isRefreshing: false,
    page: 1,
    pageSize: 10,
    hasMore: true,
    gap: rpx2px(10),
  },
  async onShow() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1, // 控制哪一项是选中状态
      });
    }

    if (wx.getStorageSync(SERVICE_FEED_REFRESH_FLAG)) {
      wx.removeStorageSync(SERVICE_FEED_REFRESH_FLAG);
      await this.reloadServiceFeed();
    }
  },

  async onLoad() {
    await this.reloadServiceFeed();
  },

  onReady() {
    this.updateTabIndicator(this.data.currentTab as number);
  },

  async onRefresherRefresh() {
    if (this.data.isRefreshing) {
      return;
    }

    this.setData({
      isRefreshing: true,
    });

    try {
      await this.reloadServiceFeed();
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

  async reloadServiceFeed() {
    this.setData({ isLoading: true });

    try {
      const page = 1;
      const pageSize = this.data.pageSize as number;
      const result = await fetchServiceFeed(page, pageSize);
      this.setData({
        allServicePosts: result.items,
        page,
        hasMore: result.hasMore,
      });
      this.applyCurrentTab(this.data.currentTab);
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
      const result = await fetchServiceFeed(nextPage, pageSize);
      this.setData({
        allServicePosts: [...(this.data.allServicePosts as ServiceFeedCardView[]), ...result.items],
        page: nextPage,
        hasMore: result.hasMore,
      });
      this.applyCurrentTab(this.data.currentTab);
    } finally {
      this.setData({
        isLoadingMore: false,
      });
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
    this.updateTabIndicator(nextIndex);
    this.applyCurrentTab(nextIndex);
  },

  onTabChanged(event: WechatMiniprogram.SwiperChange) {
    const nextIndex = event.detail.current;
    if (nextIndex === this.data.currentTab) {
      return;
    }

    this.setData({
      currentTab: nextIndex,
    });
    this.updateTabIndicator(nextIndex);
    this.applyCurrentTab(nextIndex);
  },

  updateTabIndicator(tabIndex: number) {
    wx.nextTick(() => {
      const query = wx.createSelectorQuery();
      query.select(".service-tabs__track").boundingClientRect();
      query.selectAll(".service-tab").boundingClientRect();
      query.exec((result) => {
        const trackRect = result[0] as WechatMiniprogram.BoundingClientRectCallbackResult | null;
        const tabRects = result[1] as WechatMiniprogram.BoundingClientRectCallbackResult[] | null;
        const activeRect = tabRects?.[tabIndex];

        if (!trackRect || !activeRect) {
          return;
        }

        this.setData({
          tabIndicatorLeft: Math.max(0, activeRect.left - trackRect.left),
          tabIndicatorWidth: activeRect.width,
        });
      });
    });
  },

  applyCurrentTab(tabIndex: number) {
    const allServicePosts = this.data.allServicePosts as ServiceFeedCardView[];
    const servicePosts = filterPostsByTab(allServicePosts, tabIndex);

    this.setData({
      servicePosts,
      serviceTabPanels: buildServiceTabPanels(allServicePosts),
    });
  },

  openDetail(event: WechatMiniprogram.BaseEvent) {
    const { route } = event.currentTarget.dataset as { route?: string };
    if (!route) {
      return;
    }

    this.prefillPetSocialDetail(event.currentTarget.dataset.postId as string | undefined);

    wx.navigateTo({
      url: route,
    });
  },

  prefillPetSocialDetail(postId?: string) {
    if (!postId) {
      return;
    }

    const post = (this.data.servicePosts as ServiceFeedCardView[]).find(
      (item) => item.id === postId,
    );
    if (!post) {
      return;
    }

    setPetSocialDetailPrefill(buildPetSocialDetailPrefill(post));
  },
});
