import type { MiniappUserSummary } from "@utils/api-types";
import { getAuthState, syncCurrentUser } from "@utils/session";
import { getNavbarHeight, px2rpx } from "@utils/util";

type ProfileStat = {
  label: string;
  value: string;
};

type ProfileShortcut = {
  title: string;
  summary: string;
};

type ProfileView = {
  name: string;
  status: string;
  subtitle: string;
  avatar: string;
  background: string;
};

const DEFAULT_AVATAR = "/assets/profile-pawpets-avatar.png";
const DEFAULT_BACKGROUND = "/assets/main-bg-01.png";

function resolveBackground(bgType?: string | null) {
  return bgType ? `/assets/${bgType}.png` : DEFAULT_BACKGROUND;
}

function formatPhoneStatus(user: MiniappUserSummary | null) {
  return user?.phoneAuthorized ? "已绑定手机号" : "未绑定手机号";
}

function formatBirthday(user: MiniappUserSummary | null) {
  return user?.birthday || "未设置生日";
}

function formatCity(user: MiniappUserSummary | null) {
  return user?.region.city || "未设置城市";
}

function formatSubtitle(user: MiniappUserSummary | null) {
  const parts = [user?.gender || "保密", user?.birthday || "", user?.region.city || ""].filter(
    Boolean,
  );

  return parts.length > 0 ? parts.join(" · ") : "记录一下你的第一条内容";
}

function buildProfile(user: MiniappUserSummary | null): ProfileView {
  return {
    name: user?.nickname || "还没开始记录的宠友",
    status: formatPhoneStatus(user),
    subtitle: formatSubtitle(user),
    avatar: user?.avatarUrl || DEFAULT_AVATAR,
    background: resolveBackground(user?.bgType),
  };
}

Page({
  data: {
    profile: buildProfile(null),
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
    topHeightPx: 0,
    panelHeightPx: 0,
    panelStickyStartPx: 0,
    panelScrollTop: 0,
    isPanelSticky: false,
  },
  onLoad() {
    const { statusHeight, navBarHeight } = getNavbarHeight();
    const windowInfo = wx.getWindowInfo();
    const topHeightPx = statusHeight + navBarHeight;

    this.setData({
      topHeight: px2rpx(topHeightPx),
      topHeightPx,
      panelHeightPx: Math.max(windowInfo.windowHeight - topHeightPx, 0),
    });
    this.applyUserProfile(getAuthState().user);
    void this.loadProfile();
  },

  onReady() {
    this.measurePanelStickyStart();
  },

  onShow() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 4,
      });
    }
    this.applyUserProfile(getAuthState().user);
  },

  onPageScroll(event: { scrollTop: number }) {
    const scrollTop = event.scrollTop;

    if (!this.data.isPanelSticky && scrollTop >= this.data.panelStickyStartPx) {
      this.setData({
        isPanelSticky: true,
      });
      return;
    }

    if (this.data.isPanelSticky && scrollTop < this.data.panelStickyStartPx) {
      this.setData({
        isPanelSticky: false,
        panelScrollTop: 0,
      });
    }
  },

  applyUserProfile(user: MiniappUserSummary | null) {
    this.setData({
      profile: buildProfile(user),
    });
  },

  async loadProfile() {
    try {
      const user = await syncCurrentUser({ allowRelogin: true });
      this.applyUserProfile(user);
    } catch {
      wx.showToast({
        title: "资料加载失败",
        icon: "none",
      });
    }
  },

  measurePanelStickyStart() {
    const query = wx.createSelectorQuery();
    query.select(".personal-panel-anchor").boundingClientRect();
    query.selectViewport().scrollOffset();
    query.exec((result) => {
      const rect = result?.[0] as WechatMiniprogram.BoundingClientRectCallbackResult | undefined;
      const viewport = result?.[1] as { scrollTop?: number } | undefined;

      if (!rect) {
        return;
      }

      const topHeightPx = this.data.topHeightPx as number;
      const scrollTop = viewport?.scrollTop || 0;

      this.setData({
        panelStickyStartPx: Math.max(rect.top + scrollTop - topHeightPx, 0),
      });
    });
  },

  handleInnerScroll(event: WechatMiniprogram.ScrollViewScroll) {
    this.setData({
      panelScrollTop: event.detail.scrollTop,
    });
  },

  handleInnerScrollToUpper() {
    this.setData({
      isPanelSticky: false,
      panelScrollTop: 0,
    });
  },

  switchTab(event: WechatMiniprogram.BaseEvent) {
    const { tab } = event.currentTarget.dataset as { tab?: string };
    if (!tab || tab === this.data.activeTab) {
      return;
    }

    this.setData({
      activeTab: tab,
      panelScrollTop: 0,
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
