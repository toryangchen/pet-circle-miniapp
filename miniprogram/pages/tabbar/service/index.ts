import { loadServiceFeed } from "@utils/api";
import { mockServiceState } from "@utils/mock-api";

const TAB_CATEGORY_MAP: Array<"ALL" | "ADOPTION" | "BOARDING" | "HOME_FEEDING" | "SECOND_HAND"> = [
  "ALL",
  "ADOPTION",
  "BOARDING",
  "HOME_FEEDING",
  "SECOND_HAND",
];

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
      const result = await loadServiceFeed();
      this.setData({
        allServicePosts: result.items,
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
