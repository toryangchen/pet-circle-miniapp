import type { MyPostCardView, PostStatus } from "@utils/api-types";
import { completeMyPost, loadMyPageData, loadMyPosts, offlineMyPost } from "@utils/api";
import { PROFILE_ACTIONS } from "@utils/mock";

const POST_STATUS_TABS = [
  { key: "", label: "全部" },
  { key: "PENDING", label: "待审核" },
  { key: "APPROVED", label: "已通过" },
  { key: "REJECTED", label: "已拒绝" },
  { key: "OFFLINE", label: "已下架" },
  { key: "COMPLETED", label: "已完成" },
] as const;

const DEFAULT_POST_PAGE_SIZE = 20;

type PostStatusFilter = PostStatus | "";
let postListRequestId = 0;

function decoratePosts(posts: MyPostCardView[]) {
  return posts.map((post) => ({
    ...post,
    actions:
      post.type === "SERVICE" && post.status === "APPROVED"
        ? [
            { key: "complete", label: "标记完成" },
            { key: "offline", label: "手动下架" },
          ]
        : [],
  }));
}

Page({
  data: {
    title: "我的",
    nickname: "未登录",
    avatarUrl: null as string | null,
    phoneStatus: "登录不可用",
    phoneMask: "可继续浏览公开内容",
    stats: [
      { label: "收藏", value: "0" },
      { label: "发布", value: "0" },
      { label: "消息", value: "0" },
    ],
    actions: PROFILE_ACTIONS,
    favorites: [] as Array<{
      id: string;
      route: string;
      image: string;
      badge: string;
      title: string;
      summary: string;
      meta: string;
    }>,
    posts: [] as ReturnType<typeof decoratePosts>,
    postStatusTabs: POST_STATUS_TABS,
    currentPostStatus: "" as PostStatusFilter,
    postPage: 1,
    postPageSize: DEFAULT_POST_PAGE_SIZE,
    postTotal: 0,
    postHasMore: false,
    isPostLoadingMore: false,
    isLoading: false,
  },
  onShow() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 4, // 控制哪一项是选中状态
      });
    }
  },

  async onLoad() {
    await this.reloadPageData();
  },

  async reloadPageData() {
    this.setData({ isLoading: true });

    try {
      const profile = await loadMyPageData();
      const currentStatus = this.data.currentPostStatus as PostStatusFilter;
      const publishTotal = Number(
        profile.stats.find((item) => item.label === "发布")?.value ?? profile.posts.length,
      );
      const posts =
        currentStatus === ""
          ? {
              items: profile.posts,
              total: publishTotal,
              hasMore: publishTotal > profile.posts.length,
            }
          : await loadMyPosts(currentStatus, 1, DEFAULT_POST_PAGE_SIZE);

      this.setData({
        nickname: profile.nickname,
        avatarUrl: profile.avatarUrl,
        phoneStatus: profile.phoneStatus,
        phoneMask: profile.phoneMask,
        stats: profile.stats,
        favorites: profile.favorites,
        posts: decoratePosts(posts.items),
        postPage: 1,
        postPageSize: DEFAULT_POST_PAGE_SIZE,
        postTotal: posts.total,
        postHasMore: posts.hasMore,
      });
    } catch (error) {
      wx.showToast({
        title: error instanceof Error ? error.message : "加载我的页面失败",
        icon: "none",
      });
    } finally {
      this.setData({ isLoading: false });
    }
  },

  async switchPostStatus(event: WechatMiniprogram.BaseEvent) {
    const { status } = event.currentTarget.dataset as {
      status?: PostStatusFilter;
    };
    if (status === undefined || status === this.data.currentPostStatus) {
      return;
    }

    this.setData({
      currentPostStatus: status,
    });

    await this.reloadPostList({
      status,
      page: 1,
      append: false,
    });
  },

  async loadMorePosts() {
    if (this.data.isLoading || this.data.isPostLoadingMore || !this.data.postHasMore) {
      return;
    }

    await this.reloadPostList({
      status: this.data.currentPostStatus as PostStatusFilter,
      page: this.data.postPage + 1,
      append: true,
    });
  },

  async reloadPostList(options: { status: PostStatusFilter; page: number; append: boolean }) {
    const requestId = Date.now();
    postListRequestId = requestId;
    this.setData({
      isLoading: !options.append,
      isPostLoadingMore: options.append,
    });

    try {
      const result = await loadMyPosts(
        options.status || undefined,
        options.page,
        DEFAULT_POST_PAGE_SIZE,
      );
      if (postListRequestId !== requestId) {
        return;
      }

      const nextPosts = options.append
        ? [...this.data.posts, ...decoratePosts(result.items)]
        : decoratePosts(result.items);

      this.setData({
        posts: nextPosts,
        postPage: result.page,
        postPageSize: result.pageSize,
        postTotal: result.total,
        postHasMore: result.hasMore,
      });
    } catch (error) {
      wx.showToast({
        title: error instanceof Error ? error.message : "加载发布列表失败",
        icon: "none",
      });
    } finally {
      if (postListRequestId === requestId) {
        this.setData({
          isLoading: false,
          isPostLoadingMore: false,
        });
      }
    }
  },

  openFavorite(event: WechatMiniprogram.BaseEvent) {
    const { route } = event.currentTarget.dataset as { route?: string };
    if (!route) {
      return;
    }

    wx.navigateTo({
      url: route,
    });
  },

  openPost(event: WechatMiniprogram.BaseEvent) {
    const { route } = event.currentTarget.dataset as { route?: string };
    if (!route) {
      return;
    }

    wx.navigateTo({
      url: route,
    });
  },

  async handlePostAction(event: WechatMiniprogram.BaseEvent) {
    const { action, postId } = event.currentTarget.dataset as {
      action?: "offline" | "complete";
      postId?: string;
    };

    if (!action || !postId) {
      return;
    }

    this.setData({ isLoading: true });

    try {
      if (action === "offline") {
        await offlineMyPost(postId);
        wx.showToast({
          title: "已下架",
          icon: "success",
        });
      } else {
        await completeMyPost(postId);
        wx.showToast({
          title: "已标记完成",
          icon: "success",
        });
      }

      await this.reloadPageData();
    } catch (error) {
      wx.showToast({
        title: error instanceof Error ? error.message : "操作失败",
        icon: "none",
      });
    } finally {
      this.setData({ isLoading: false });
    }
  },
});
