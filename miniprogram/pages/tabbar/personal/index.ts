import type {
  FeedCardView,
  MiniappUserSummary,
  MyPostCardView,
  PagedResult,
} from "@utils/api-types";
import { setPetSocialDetailPrefill } from "@utils/detail-prefill";
import { request } from "@utils/request";
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

type PersonalPostCardView = FeedCardView & {
  type: MyPostCardView["type"];
  serviceCategory: MyPostCardView["serviceCategory"];
  status: MyPostCardView["status"];
  rejectReason?: string | null;
};

const DEFAULT_AVATAR = "/assets/profile-pawpets-avatar.png";
const DEFAULT_BACKGROUND = "/assets/main-bg-01.png";
const DEFAULT_POST_IMAGE = "/assets/main-bg-02.png";
const PERSONAL_POSTS_REFRESH_FLAG = "personal_posts_needs_refresh";

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

function resolveStatusBadge(status: MyPostCardView["status"]) {
  const statusMap: Record<MyPostCardView["status"], string> = {
    PENDING: "审核中",
    APPROVED: "",
    REJECTED: "未通过",
    OFFLINE: "已下线",
    COMPLETED: "已完成",
  };

  return statusMap[status];
}

function resolvePostTypeBadge(item: MyPostCardView) {
  if (item.type === "PET_SOCIAL") {
    return "宠物圈";
  }

  switch (item.serviceCategory) {
    case "ADOPTION":
      return "领养";
    case "BOARDING":
      return "宠物寄养";
    case "SECOND_HAND":
      return "闲置";
    case "OTHER":
      return "其它";
    default:
      return "上门喂养";
  }
}

function toPersonalPostCardView(item: MyPostCardView): PersonalPostCardView {
  return {
    id: item.id,
    title: item.title,
    summary: item.summary,
    image: item.coverImage || DEFAULT_POST_IMAGE,
    badge: resolveStatusBadge(item.status) || resolvePostTypeBadge(item),
    author: item.author || "我的发布",
    authorAvatarUrl: item.authorAvatarUrl ?? null,
    meta: item.city,
    route: item.route || `/pages/detail/pet-social/index?id=${item.id}`,
    favoriteCount: item.stats.favoriteCount,
    favorited: item.viewerState.favorited,
    type: item.type,
    serviceCategory: item.serviceCategory,
    status: item.status,
    rejectReason: item.rejectReason,
  };
}

async function fetchMyPosts(page: number, pageSize: number) {
  const result = await request<PagedResult<MyPostCardView>>({
    method: "POST",
    path: `/posts/my?page=${page}&pageSize=${pageSize}`,
  });

  return {
    ...result,
    items: result.items.map(toPersonalPostCardView),
  };
}

function buildPetSocialDetailPrefill(item: PersonalPostCardView) {
  const isServiceDetail = item.type === "SERVICE";

  return {
    id: item.id,
    title: item.title,
    summary: item.summary,
    image: item.image,
    authorName: item.author,
    authorAvatarUrl: item.authorAvatarUrl ?? "",
    favoriteCount: item.favoriteCount,
    favorited: item.favorited,
    isServiceDetail,
    badge: item.badge,
    serviceDescription: isServiceDetail ? item.summary : undefined,
    serviceFields: isServiceDetail
      ? [
          { label: "服务类型", value: item.badge },
          { label: "服务状态", value: resolveStatusBadge(item.status) || "展示中" },
          { label: "服务区域", value: item.meta || "同城可约" },
          { label: "联系入口", value: "发布者本人可管理" },
        ]
      : undefined,
    phoneAuthorized: false,
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
    posts: [] as PersonalPostCardView[],
    page: 1,
    pageSize: 10,
    hasMore: true,
    isLoadingPosts: false,
    isLoadingMorePosts: false,
    gap: rpx2px(10),

    type: "fade",
    duration: 300,
    closedElevation: 0,
    closedBorderRadius: 4,
    openElevation: 0,
    openBorderRadius: 0,

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
    void this.reloadPosts();
  },

  onShow() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 4,
      });
    }
    this.applyUserProfile(getAuthState().user);
    if (wx.getStorageSync(PERSONAL_POSTS_REFRESH_FLAG)) {
      wx.removeStorageSync(PERSONAL_POSTS_REFRESH_FLAG);
      void this.reloadPosts();
    }
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

  async onScrollToLower() {
    if (this.data.activeTab !== "发布") {
      return;
    }

    await this.loadNextPostsPage();
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

  async reloadPosts() {
    this.setData({ isLoadingPosts: true });

    try {
      const page = 1;
      const pageSize = this.data.pageSize as number;
      const result = await fetchMyPosts(page, pageSize);
      this.setData({
        posts: result.items,
        page,
        hasMore: result.hasMore,
        stats: (this.data.stats as ProfileStat[]).map((item) =>
          item.label === "发布" ? { ...item, value: String(result.total) } : item,
        ),
      });
    } catch {
      wx.showToast({
        title: "发布列表加载失败",
        icon: "none",
      });
    } finally {
      this.setData({ isLoadingPosts: false });
    }
  },

  async loadNextPostsPage() {
    if (this.data.isLoadingPosts || this.data.isLoadingMorePosts || !this.data.hasMore) {
      return;
    }

    const nextPage = (this.data.page as number) + 1;
    const pageSize = this.data.pageSize as number;

    this.setData({
      isLoadingMorePosts: true,
    });

    try {
      const result = await fetchMyPosts(nextPage, pageSize);
      this.setData({
        posts: [...(this.data.posts as PersonalPostCardView[]), ...result.items],
        page: nextPage,
        hasMore: result.hasMore,
      });
    } finally {
      this.setData({
        isLoadingMorePosts: false,
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

  prefillPetSocialDetail(postId?: string) {
    if (!postId) {
      return;
    }

    const post = (this.data.posts as PersonalPostCardView[]).find((item) => item.id === postId);
    if (!post) {
      return;
    }

    setPetSocialDetailPrefill(buildPetSocialDetailPrefill(post));
  },

  openPostDetail(event: WechatMiniprogram.BaseEvent) {
    const { route, postId } = event.currentTarget.dataset as { route?: string; postId?: string };
    if (!route) {
      return;
    }

    this.prefillPetSocialDetail(postId);

    wx.navigateTo({
      url: route,
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
