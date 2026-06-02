import type {
  FeedCardView,
  FeedItem,
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

type PersonalTab = "发布" | "收藏" | "浏览";

type PersonalPostCardView = FeedCardView & {
  type?: MyPostCardView["type"];
  serviceCategory?: MyPostCardView["serviceCategory"];
  status?: MyPostCardView["status"];
  rejectReason?: string | null;
};

type FeedHistoryItem = FeedItem & {
  viewedAt?: string;
};

type TabEmptyState = {
  title: string;
  summary: string;
  cta: string;
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

function resolveFeedBadge(item: FeedItem) {
  if (item.badge) {
    return item.badge;
  }

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

function resolveStatusSummary(item: MyPostCardView) {
  switch (item.status) {
    case "PENDING":
      return "内容已提交，正在等待审核。";
    case "REJECTED":
      return item.rejectReason || "内容未通过审核，可调整后重新发布。";
    case "OFFLINE":
      return "内容已下线，仅自己可见。";
    case "COMPLETED":
      return "这条服务已完成。";
    default:
      return item.type === "SERVICE" ? "服务发布已展示。" : "宠物日常已展示。";
  }
}

function toPersonalPostCardView(item: MyPostCardView): PersonalPostCardView {
  return {
    id: item.id,
    title: item.title,
    summary: item.summary || resolveStatusSummary(item),
    image: item.coverImage || DEFAULT_POST_IMAGE,
    badge: resolveStatusBadge(item.status) || resolvePostTypeBadge(item),
    author: item.author || "我的发布",
    authorAvatarUrl: item.authorAvatarUrl ?? null,
    meta: item.city,
    route: item.route || `/pages/detail/pet-social/index?id=${item.id}`,
    favoriteCount: item.stats?.favoriteCount ?? 0,
    favorited: item.viewerState?.favorited ?? false,
    type: item.type,
    serviceCategory: item.serviceCategory,
    status: item.status,
    rejectReason: item.rejectReason,
  };
}

function toFeedCardView(item: FeedHistoryItem): PersonalPostCardView {
  return {
    id: item.id,
    title: item.title,
    summary: item.summary,
    image: item.coverImage || DEFAULT_POST_IMAGE,
    badge: resolveFeedBadge(item),
    author: item.author || "宠友分享",
    authorAvatarUrl: item.authorAvatarUrl ?? null,
    meta: item.meta || item.city,
    route: item.route || `/pages/detail/pet-social/index?id=${item.id}`,
    favoriteCount: item.stats.favoriteCount,
    favorited: item.viewerState.favorited,
    type: item.type,
    serviceCategory: item.serviceCategory,
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

async function fetchFavoritePosts(page: number, pageSize: number) {
  const result = await request<PagedResult<FeedItem>>({
    method: "POST",
    path: `/favorites/my?page=${page}&pageSize=${pageSize}`,
  });

  return {
    ...result,
    items: result.items.map(toFeedCardView),
  };
}

async function fetchHistoryPosts(page: number, pageSize: number) {
  const result = await request<PagedResult<FeedHistoryItem>>({
    method: "POST",
    path: `/posts/history?page=${page}&pageSize=${pageSize}`,
  });

  return {
    ...result,
    items: result.items.map(toFeedCardView),
  };
}

function resolveEmptyState(tab: PersonalTab): TabEmptyState {
  if (tab === "收藏") {
    return {
      title: "还没有收藏内容",
      summary: "遇到喜欢的宠物日常或服务信息，可以先收藏起来，之后回到这里继续看。",
      cta: "去逛逛",
    };
  }

  if (tab === "浏览") {
    return {
      title: "还没有浏览记录",
      summary: "打开宠物圈或服务详情后，最近看过的内容会留在这里，方便你回头找。",
      cta: "去发现",
    };
  }

  return {
    title: "还没有发布记录",
    summary: "分享宠物日常、记录救助故事，或者发布一条本地服务信息，让更多宠友看见你。",
    cta: "去记录",
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
          {
            label: "服务状态",
            value: item.status ? resolveStatusBadge(item.status) || "展示中" : "展示中",
          },
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
    tabs: ["发布", "收藏", "浏览"],
    activeTab: "发布",
    emptyState: resolveEmptyState("发布"),
    posts: [] as PersonalPostCardView[],
    favoritePosts: [] as PersonalPostCardView[],
    historyPosts: [] as PersonalPostCardView[],
    page: 1,
    favoritePage: 1,
    historyPage: 1,
    pageSize: 10,
    hasMore: true,
    favoriteHasMore: true,
    historyHasMore: true,
    isLoadingPosts: false,
    isLoadingMorePosts: false,
    isLoadingFavorites: false,
    isLoadingMoreFavorites: false,
    isLoadingHistory: false,
    isLoadingMoreHistory: false,
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
      tabRadius: 24,
      tabSpace: 8,
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
        tabRadius: this.scrollCalculateSpace(rate, 24),
        tabSpace: this.scrollCalculateSpace(rate, 8),
      },
    });
  },

  scrollCalculateSpace(rate: number, base: number) {
    let space = rate < 1 ? 0 : base * (rate - 1);
    space = space > base ? base : space;
    return base - space;
  },

  async onScrollToLower() {
    switch (this.data.activeTab as PersonalTab) {
      case "收藏":
        await this.loadNextFavoritePostsPage();
        return;
      case "浏览":
        await this.loadNextHistoryPostsPage();
        return;
      default:
        await this.loadNextPostsPage();
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

  async reloadFavoritePosts() {
    this.setData({ isLoadingFavorites: true });

    try {
      const page = 1;
      const pageSize = this.data.pageSize as number;
      const result = await fetchFavoritePosts(page, pageSize);
      this.setData({
        favoritePosts: result.items,
        favoritePage: page,
        favoriteHasMore: result.hasMore,
        stats: (this.data.stats as ProfileStat[]).map((item) =>
          item.label === "收藏" ? { ...item, value: String(result.total) } : item,
        ),
      });
    } catch {
      wx.showToast({
        title: "收藏列表加载失败",
        icon: "none",
      });
    } finally {
      this.setData({ isLoadingFavorites: false });
    }
  },

  async loadNextFavoritePostsPage() {
    if (
      this.data.isLoadingFavorites ||
      this.data.isLoadingMoreFavorites ||
      !this.data.favoriteHasMore
    ) {
      return;
    }

    const nextPage = (this.data.favoritePage as number) + 1;
    const pageSize = this.data.pageSize as number;

    this.setData({
      isLoadingMoreFavorites: true,
    });

    try {
      const result = await fetchFavoritePosts(nextPage, pageSize);
      this.setData({
        favoritePosts: [...(this.data.favoritePosts as PersonalPostCardView[]), ...result.items],
        favoritePage: nextPage,
        favoriteHasMore: result.hasMore,
      });
    } finally {
      this.setData({
        isLoadingMoreFavorites: false,
      });
    }
  },

  async reloadHistoryPosts() {
    this.setData({ isLoadingHistory: true });

    try {
      const page = 1;
      const pageSize = this.data.pageSize as number;
      const result = await fetchHistoryPosts(page, pageSize);
      this.setData({
        historyPosts: result.items,
        historyPage: page,
        historyHasMore: result.hasMore,
      });
    } catch {
      wx.showToast({
        title: "浏览记录加载失败",
        icon: "none",
      });
    } finally {
      this.setData({ isLoadingHistory: false });
    }
  },

  async loadNextHistoryPostsPage() {
    if (this.data.isLoadingHistory || this.data.isLoadingMoreHistory || !this.data.historyHasMore) {
      return;
    }

    const nextPage = (this.data.historyPage as number) + 1;
    const pageSize = this.data.pageSize as number;

    this.setData({
      isLoadingMoreHistory: true,
    });

    try {
      const result = await fetchHistoryPosts(nextPage, pageSize);
      this.setData({
        historyPosts: [...(this.data.historyPosts as PersonalPostCardView[]), ...result.items],
        historyPage: nextPage,
        historyHasMore: result.hasMore,
      });
    } finally {
      this.setData({
        isLoadingMoreHistory: false,
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
      emptyState: resolveEmptyState(tab as PersonalTab),
    });

    switch (tab as PersonalTab) {
      case "收藏":
        if (!(this.data.favoritePosts as PersonalPostCardView[]).length) {
          void this.reloadFavoritePosts();
        }
        break;
      case "浏览":
        if (!(this.data.historyPosts as PersonalPostCardView[]).length) {
          void this.reloadHistoryPosts();
        }
        break;
      default:
        break;
    }
  },

  findPostCard(postId?: string) {
    if (!postId) {
      return null;
    }

    return (
      [
        ...(this.data.posts as PersonalPostCardView[]),
        ...(this.data.favoritePosts as PersonalPostCardView[]),
        ...(this.data.historyPosts as PersonalPostCardView[]),
      ].find((item) => item.id === postId) ?? null
    );
  },

  prefillPetSocialDetail(postId?: string) {
    const post = this.findPostCard(postId);
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
    if (this.data.activeTab !== "发布") {
      wx.switchTab({
        url: "/pages/tabbar/home/index",
      });
      return;
    }

    wx.navigateTo({
      url: "/pages/publish/index",
    });
  },
});
