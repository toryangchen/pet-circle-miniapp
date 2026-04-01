import type { MyPostCardView, PostStatus } from '../../utils/api-types';
import { completeMyPost, loadMyPageData, loadMyPosts, offlineMyPost } from '../../utils/api';
import { PROFILE_ACTIONS } from '../../utils/mock';
import { mockProfileState } from '../../utils/mock-api';

const POST_STATUS_TABS = [
  { key: '', label: '全部' },
  { key: 'PENDING', label: '待审核' },
  { key: 'APPROVED', label: '已通过' },
  { key: 'REJECTED', label: '已拒绝' },
  { key: 'OFFLINE', label: '已下架' },
  { key: 'COMPLETED', label: '已完成' },
] as const;

const DEFAULT_POST_PAGE_SIZE = 20;

type PostStatusFilter = PostStatus | '';
let postListRequestId = 0;

function decoratePosts(
  posts: MyPostCardView[],
) {
  return posts.map((post) => ({
    ...post,
    actions:
      post.type === 'SERVICE' && post.status === 'APPROVED'
        ? [
            { key: 'complete', label: '标记完成' },
            { key: 'offline', label: '手动下架' },
          ]
        : [],
  }));
}

Page({
  data: {
    title: '我的',
    nickname: mockProfileState.nickname,
    avatarUrl: mockProfileState.avatarUrl,
    phoneStatus: mockProfileState.phoneStatus,
    phoneMask: mockProfileState.phoneMask,
    stats: mockProfileState.stats,
    actions: PROFILE_ACTIONS,
    favorites: mockProfileState.favorites,
    posts: decoratePosts(mockProfileState.posts),
    postStatusTabs: POST_STATUS_TABS,
    currentPostStatus: '' as PostStatusFilter,
    postPage: 1,
    postPageSize: DEFAULT_POST_PAGE_SIZE,
    postTotal: mockProfileState.posts.length,
    postHasMore: false,
    isPostLoadingMore: false,
    isLoading: false,
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
        profile.stats.find((item) => item.label === '发布')?.value ?? profile.posts.length,
      );
      const posts =
        currentStatus === ''
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
    } finally {
      this.setData({ isLoading: false });
    }
  },

  async switchPostStatus(event: WechatMiniprogram.BaseEvent) {
    const { status } = event.currentTarget.dataset as { status?: PostStatusFilter };
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

  async reloadPostList(options: {
    status: PostStatusFilter;
    page: number;
    append: boolean;
  }) {
    const requestId = Date.now();
    postListRequestId = requestId;
    this.setData({
      isLoading: !options.append,
      isPostLoadingMore: options.append,
    });

    try {
      const result = await loadMyPosts(options.status || undefined, options.page, DEFAULT_POST_PAGE_SIZE);
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
      action?: 'offline' | 'complete';
      postId?: string;
    };

    if (!action || !postId) {
      return;
    }

    this.setData({ isLoading: true });

    try {
      if (action === 'offline') {
        await offlineMyPost(postId);
        wx.showToast({
          title: '已下架',
          icon: 'success',
        });
      } else {
        await completeMyPost(postId);
        wx.showToast({
          title: '已标记完成',
          icon: 'success',
        });
      }

      await this.reloadPageData();
    } finally {
      this.setData({ isLoading: false });
    }
  },

});
