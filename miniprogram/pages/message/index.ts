import { loadNotifications, markAllNotificationsRead, markNotificationRead } from '../../utils/api';
import { mockMessageState } from '../../utils/mock-api';

Page({
  data: {
    title: mockMessageState.title,
    unreadCount: mockMessageState.unreadCount,
    notifications: mockMessageState.notifications,
    isLoading: false,
  },

  async onLoad() {
    await this.reloadNotifications();
  },

  async reloadNotifications() {
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

  async openConversation(event: WechatMiniprogram.BaseEvent) {
    const { id, route } = event.currentTarget.dataset as { id?: string; route?: string };
    if (!route) {
      return;
    }

    if (id) {
      await markNotificationRead(id);
      this.setData({
        notifications: this.data.notifications.map((item) =>
          item.id === id ? { ...item, unread: false } : item,
        ),
        unreadCount: Math.max(
          0,
          this.data.notifications.filter((item) => item.unread && item.id !== id).length,
        ),
      });
    }

    wx.navigateTo({
      url: route,
    });
  },

  async markAllRead() {
    await markAllNotificationsRead();
    this.setData({
      notifications: this.data.notifications.map((item) => ({
        ...item,
        unread: false,
      })),
      unreadCount: 0,
    });
    wx.showToast({
      title: '已全部标记已读',
      icon: 'success',
    });
  },
});
