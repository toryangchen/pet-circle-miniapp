import { getNavbarHeight } from "@utils/util";

type ProfileStat = {
  label: string;
  value: string;
};

type ProfileShortcut = {
  title: string;
  summary: string;
};

Page({
  data: {
    profile: {
      name: "还没开始记录的宠友",
      status: "已绑定手机号",
      subtitle: "记录一下你的第一条内容",
    },
    stats: [
      { label: "收藏", value: "0" },
      { label: "发布", value: "0" },
      { label: "获赞", value: "0" },
    ] as ProfileStat[],
    shortcuts: [
      { title: "我的收藏", summary: "还没有收藏内容" },
      { title: "我的发布", summary: "还没有发布记录" },
    ] as ProfileShortcut[],
    tabs: ["发布", "收藏", "点赞"],
    activeTab: "发布",
    emptyState: {
      title: "还没有发布记录",
      summary: "分享宠物日常、记录救助故事，或者发布一条本地服务信息，让更多宠友看见你。",
      cta: "去记录",
    },
    topHeight: 0,
  },
  onLoad() {
    const { statusHeight, navBarHeight } = getNavbarHeight();
    this.setData({ topHeight: statusHeight + navBarHeight });
  },

  onShow() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 4,
      });
    }
  },

  switchTab(event: WechatMiniprogram.BaseEvent) {
    const { tab } = event.currentTarget.dataset as { tab?: string };
    if (!tab || tab === this.data.activeTab) {
      return;
    }

    this.setData({
      activeTab: tab,
    });
  },

  editProfile() {
    wx.navigateTo({
      url: "/pages/profileEdit/index",
    });
  },

  goCreate() {
    wx.switchTab({
      url: "/pages/publish/index",
      fail: () => {
        wx.reLaunch({
          url: "/pages/publish/index",
        });
      },
    });
  },
});
