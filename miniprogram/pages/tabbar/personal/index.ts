import type { MiniappUserSummary } from "@utils/api-types";
import { getAuthState, syncCurrentUser } from "@utils/session";
import { getNavbarHeight, rpx2px } from "@utils/util";

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

    pageDistance: {
      topHeight: 0,
      menuTop: 0,
      menuHeight: 0,
      opacityRate: 0,
      stickyHeight: 0,
    },
  },
  onLoad() {
    const { statusHeight, navBarHeight, menuTop, menuHeight } = getNavbarHeight();
    const topHeight = statusHeight + navBarHeight;
    Object.assign(this.data.pageDistance, {
      topHeight,
      menuTop,
      menuHeight,
      stickyHeight: topHeight + rpx2px(20),
    });
    this.setData({
      pageDistance: this.data.pageDistance,
    });
    this.applyUserProfile(getAuthState().user);
    void this.loadProfile();
  },

  onShow() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 4,
      });
    }
    this.applyUserProfile(getAuthState().user);
  },
  onScroll(event: WechatMiniprogram.ScrollViewScroll) {
    const { scrollTop } = event.detail;
    const { topHeight } = this.data.pageDistance;
    const rate = scrollTop / topHeight;

    this.setData({
      pageDistance: {
        ...this.data.pageDistance,
        opacityRate: rate >= 1 ? 1 : rate,
      },
    });
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
    wx.navigateTo({
      url: "/pages/publish/index",
    });
  },
});
