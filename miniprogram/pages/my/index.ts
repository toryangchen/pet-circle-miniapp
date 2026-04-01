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
];

function decoratePosts(
  posts: Array<{
    id: string;
    type: string;
    status: string;
    title: string;
    summary: string;
    route: string;
  }>,
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
    currentPostStatus: '',
    isLoading: false,
  },

  async onLoad() {
    await this.reloadPageData();
  },

  async reloadPageData() {
    this.setData({ isLoading: true });

    try {
      const profile = await loadMyPageData();
      const posts = await loadMyPosts(this.data.currentPostStatus);
      this.setData({
        nickname: profile.nickname,
        avatarUrl: profile.avatarUrl,
        phoneStatus: profile.phoneStatus,
        phoneMask: profile.phoneMask,
        stats: profile.stats,
        favorites: profile.favorites,
        posts: decoratePosts(posts.items),
      });
    } finally {
      this.setData({ isLoading: false });
    }
  },

  async switchPostStatus(event: WechatMiniprogram.BaseEvent) {
    const { status } = event.currentTarget.dataset as { status?: string };
    if (status === undefined || status === this.data.currentPostStatus) {
      return;
    }

    this.setData({
      currentPostStatus: status,
      isLoading: true,
    });

    try {
      const posts = await loadMyPosts(status);
      this.setData({
        posts: decoratePosts(posts.items),
      });
    } finally {
      this.setData({ isLoading: false });
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
