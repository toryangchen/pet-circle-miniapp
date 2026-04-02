import { loadHomeFeed } from "@utils/api";
import { mockHomeState } from "@utils/mock-api";

Page({
  data: {
    location: mockHomeState.location,
    title: mockHomeState.title,
    heroTitle: mockHomeState.heroTitle,
    heroSummary: mockHomeState.heroSummary,
    tags: mockHomeState.tags,
    featuredPosts: mockHomeState.featuredPosts,
    isLoading: false,
  },

  async onLoad() {
    this.setData({ isLoading: true });

    try {
      const result = await loadHomeFeed();
      this.setData({
        location: mockHomeState.location,
        title: mockHomeState.title,
        heroTitle: mockHomeState.heroTitle,
        heroSummary: mockHomeState.heroSummary,
        tags: mockHomeState.tags,
        featuredPosts: result.items,
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

  goService() {
    wx.reLaunch({
      url: "/pages/service/index",
    });
  },
});
