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
};

const MOCK_NOTIFICATIONS: NotificationItemView[] = [
  {
    id: "notification-1",
    unread: true,
    route: "/pages/detail/pet-social/index?id=service-1",
    title: "雪球",
    summary: "收藏了你的服务发布《周末可上门喂猫》",
    time: "2分钟前",
    type: "favorite",
    icon: "/assets/message-favorite.png",
  },
  {
    id: "notification-2",
    unread: true,
    route: "/pages/detail/pet-social/index?id=home-1",
    title: "可乐妈",
    summary: "收藏了你的笔记《城墙根下的橘猫日常》",
    time: "18分钟前",
    type: "favorite",
    icon: "/assets/message-favorite.png",
  },
  {
    id: "notification-3",
    unread: true,
    route: "/pages/detail/pet-social/index?id=service-1",
    title: "阿满",
    summary: "评论了你：周五晚上也可以接猫咪寄养吗？",
    time: "今天 09:24",
    type: "comment",
    icon: "/assets/message-comment.png",
  },
  {
    id: "notification-4",
    unread: true,
    route: "/pages/detail/pet-social/index?id=home-1",
    title: "小雨",
    summary: "回复了你：已私信你联系方式，记得查收。",
    time: "昨天",
    type: "comment",
    icon: "/assets/message-comment.png",
  },
  {
    id: "notification-5",
    unread: true,
    route: "/pages/detail/pet-social/index?id=service-1",
    title: "西安宠友群",
    summary: "你好，想咨询一下上门喂养的时间，清明假期可以约吗？",
    time: "周一",
    type: "direct",
    icon: "/assets/message-direct.png",
  },
  {
    id: "notification-6",
    unread: true,
    route: "/pages/detail/pet-social/index?id=service-1",
    title: "豆包妈妈",
    summary: "二手航空箱还在吗？如果方便的话我想周末自提。",
    time: "3月28日",
    type: "direct",
    icon: "/assets/message-direct.png",
  },
];

Page({
  data: {
    title: "消息",
    unreadCount: MOCK_NOTIFICATIONS.length,
    notifications: MOCK_NOTIFICATIONS,
    isLoading: false,
  },

  onShow() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 3,
      });
    }
  },

  onLoad() {
    this.setData({
      notifications: MOCK_NOTIFICATIONS,
      unreadCount: MOCK_NOTIFICATIONS.filter((item) => item.unread).length,
    });
  },

  openConversation(event: WechatMiniprogram.BaseEvent) {
    const { id, route } = event.currentTarget.dataset as {
      id?: string;
      route?: string;
    };
    if (!route) {
      return;
    }

    if (id) {
      const nextNotifications = this.data.notifications.map((item) =>
        item.id === id ? { ...item, unread: false } : item,
      );

      this.setData({
        notifications: nextNotifications,
        unreadCount: nextNotifications.filter((item) => item.unread).length,
      });
    }

    wx.navigateTo({
      url: route,
    });
  },

  markAllRead() {
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
  },
});
