import { loadNotifications, markAllNotificationsRead, markNotificationRead } from "@utils/api";

Page({
  data: {
    title: "消息",
    unreadCount: 0,
    notifications: [] as Array<{
      id: string;
      unread: boolean;
      route: string;
      title: string;
      summary: string;
      time: string;
      conversationId: string | null;
      type: string;
    }>,
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
    } catch {
      this.setData({
        notifications: [],
        unreadCount: 0,
      });
    } finally {
      this.setData({ isLoading: false });
    }
  },

  async openConversation(event: WechatMiniprogram.BaseEvent) {
    const { id, route } = event.currentTarget.dataset as {
      id?: string;
      route?: string;
    };
    if (!route) {
      return;
    }

    if (id) {
      try {
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
      } catch {
        // Continue navigation even if the read-state sync fails.
      }
    }

    wx.navigateTo({
      url: route,
    });
  },

  async markAllRead() {
    try {
      await markAllNotificationsRead();
      this.setData({
        notifications: this.data.notifications.map((item) => ({
          ...item,
          unread: false,
        })),
        unreadCount: 0,
      });
      wx.showToast({
        title: "已全部标记已读",
        icon: "success",
      });
    } catch (error) {
      wx.showToast({
        title: error instanceof Error ? error.message : "操作失败",
        icon: "none",
      });
    }
  },
});
