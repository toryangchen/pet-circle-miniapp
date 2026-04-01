import { completeMyPost, loadMyPageData, offlineMyPost } from '../../utils/api';
import { PROFILE_ACTIONS } from '../../utils/mock';
import { mockProfileState } from '../../utils/mock-api';

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
    isLoading: false,
  },

  async onLoad() {
    await this.reloadPageData();
  },

  async reloadPageData() {
    this.setData({ isLoading: true });

    try {
      const profile = await loadMyPageData();
      this.setData({
        nickname: profile.nickname,
        avatarUrl: profile.avatarUrl,
        phoneStatus: profile.phoneStatus,
        phoneMask: profile.phoneMask,
        stats: profile.stats,
        favorites: profile.favorites,
        posts: decoratePosts(profile.posts),
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
