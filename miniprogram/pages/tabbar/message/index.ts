import type {
  NotificationItem,
  NotificationListResult,
  NotificationType,
} from "@utils/api-types";
import { request } from "@utils/request";

type NotificationVisualType = "favorite" | "comment" | "direct";

type NotificationItemView = {
  id: string;
  unread: boolean;
  route: string;
  title: string;
  summary: string;
  time: string;
  type: NotificationVisualType;
  icon: string;
  conversationId: string | null;
};

const PAGE_SIZE = 10;

function formatRelativeTime(createdAt: string) {
  const date = new Date(createdAt);
  const timestamp = date.getTime();
  if (Number.isNaN(timestamp)) {
    return "刚刚";
  }

  const diff = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff >= 0 && diff < minute) {
    return "刚刚";
  }

  if (diff >= minute && diff < hour) {
    return `${Math.max(1, Math.floor(diff / minute))}分钟前`;
  }

  if (diff >= hour && diff < day) {
    return `${Math.max(1, Math.floor(diff / hour))}小时前`;
  }

  if (diff >= day && diff < 2 * day) {
    return "昨天";
  }

  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const dayOfMonth = `${date.getDate()}`.padStart(2, "0");
  return `${month}-${dayOfMonth}`;
}

function getNotificationTitle(type: NotificationType) {
  const titleMap: Record<NotificationType, string> = {
    LIKE_POST: "新增点赞",
    COMMENT_POST: "新评论",
    REPLY_COMMENT: "评论回复",
    CONTACT_REQUEST: "收到联系申请",
    CONTACT_APPROVED: "联系申请通过",
  };

  return titleMap[type];
}

function getNotificationVisualType(type: NotificationType): NotificationVisualType {
  if (type === "CONTACT_REQUEST" || type === "CONTACT_APPROVED") {
    return "direct";
  }

  if (type === "COMMENT_POST" || type === "REPLY_COMMENT") {
    return "comment";
  }

  return "favorite";
}

function getNotificationIcon(type: NotificationType) {
  const visualType = getNotificationVisualType(type);
  const iconMap: Record<NotificationVisualType, string> = {
    favorite: "/assets/message-favorite.png",
    comment: "/assets/message-comment.png",
    direct: "/assets/message-direct.png",
  };

  return iconMap[visualType];
}

function buildNotificationRoute(item: NotificationItem) {
  if (
    (item.type === "CONTACT_REQUEST" || item.type === "CONTACT_APPROVED") &&
    item.conversationId
  ) {
    const peerName = encodeURIComponent(item.actor?.nickname || "宠友");
    return `/pages/detail/conversation/index?id=${item.conversationId}&peerName=${peerName}`;
  }

  if (item.post) {
    return `/pages/detail/pet-social/index?id=${item.post.id}`;
  }

  return "";
}

function toNotificationView(item: NotificationItem): NotificationItemView {
  const visualType = getNotificationVisualType(item.type);

  return {
    id: item.id,
    unread: !item.isRead,
    route: buildNotificationRoute(item),
    title: item.actor?.nickname || getNotificationTitle(item.type),
    summary: item.summary,
    time: formatRelativeTime(item.createdAt),
    type: visualType,
    icon: getNotificationIcon(item.type),
    conversationId: item.conversationId,
  };
}

async function fetchNotifications(page: number) {
  if (page === 1) {
    return request<NotificationListResult>({
      method: "POST",
      path: "/notifications",
    });
  }

  return request<NotificationListResult>({
    method: "POST",
    path: `/notifications?page=${page}&pageSize=${PAGE_SIZE}`,
  });
}

async function markNotificationRead(notificationId: string) {
  return request<{ id: string; isRead: boolean }>({
    method: "POST",
    path: `/notifications/${notificationId}/read`,
  });
}

async function markNotificationsReadAll() {
  return request<{ updatedCount: number }>({
    method: "POST",
    path: "/notifications/read-all",
  });
}

Page({
  data: {
    title: "消息",
    unreadCount: 0,
    notifications: [] as NotificationItemView[],
    page: 1,
    hasMore: false,
    isLoading: false,
    isLoadingMore: false,
    isRefreshing: false,
    errorText: "",
  },

  onShow() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 3,
      });
    }
  },

  onLoad() {
    void this.loadNotifications({ reset: true });
  },

  async loadNotifications(options: { reset?: boolean } = {}) {
    if (this.data.isLoading || this.data.isLoadingMore) {
      return;
    }

    const reset = Boolean(options.reset);
    const nextPage = reset ? 1 : this.data.page + 1;

    this.setData({
      isLoading: reset,
      isLoadingMore: !reset,
      errorText: "",
    });

    try {
      const result = await fetchNotifications(nextPage);
      const nextItems = result.items.map(toNotificationView);
      this.setData({
        notifications: reset ? nextItems : this.data.notifications.concat(nextItems),
        unreadCount: result.unreadCount,
        page: result.page,
        hasMore: result.hasMore,
      });
    } catch (error) {
      this.setData({
        errorText: error instanceof Error ? error.message : "消息加载失败",
      });
      wx.showToast({
        title: "消息加载失败",
        icon: "none",
      });
    } finally {
      this.setData({
        isLoading: false,
        isLoadingMore: false,
        isRefreshing: false,
      });
      wx.stopPullDownRefresh();
    }
  },

  onPullDownRefresh() {
    this.setData({
      isRefreshing: true,
    });
    void this.loadNotifications({ reset: true });
  },

  loadMoreNotifications() {
    if (!this.data.hasMore || this.data.isLoadingMore || this.data.isLoading) {
      return;
    }

    void this.loadNotifications();
  },

  async openConversation(event: WechatMiniprogram.BaseEvent) {
    const { id, route } = event.currentTarget.dataset as {
      id?: string;
      route?: string;
    };
    if (!id || !route) {
      return;
    }

    const currentItem = this.data.notifications.find((item) => item.id === id);
    if (currentItem?.unread) {
      const nextNotifications = this.data.notifications.map((item) =>
        item.id === id ? { ...item, unread: false } : item,
      );
      this.setData({
        notifications: nextNotifications,
        unreadCount: Math.max(0, this.data.unreadCount - 1),
      });

      try {
        await markNotificationRead(id);
      } catch {
        await this.loadNotifications({ reset: true });
        wx.showToast({
          title: "已读状态同步失败",
          icon: "none",
        });
        return;
      }
    }

    wx.navigateTo({
      url: route,
    });
  },

  async markAllRead() {
    if (this.data.unreadCount === 0) {
      return;
    }

    try {
      await markNotificationsReadAll();
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
        title: error instanceof Error ? error.message : "标记失败",
        icon: "none",
      });
    }
  },
});
