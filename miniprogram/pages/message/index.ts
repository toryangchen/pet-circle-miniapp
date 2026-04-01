import { loadNotifications } from '../../utils/api';
import { mockMessageState } from '../../utils/mock-api';

Page({
  data: {
    title: mockMessageState.title,
    unreadCount: mockMessageState.unreadCount,
    notifications: mockMessageState.notifications,
    isLoading: false,
  },

  async onLoad() {
    this.setData({ isLoading: true });

    try {
      const result = await loadNotifications();
      this.setData({
        notifications: result.items,
        unreadCount: result.items.filter((item) => item.unread).length,
      });
    } finally {
      this.setData({ isLoading: false });
    }
  },

  openConversation(event: WechatMiniprogram.BaseEvent) {
    const { route } = event.currentTarget.dataset as { route?: string };
    if (!route) {
      return;
    }

    wx.navigateTo({
      url: route,
    });
  },
});
