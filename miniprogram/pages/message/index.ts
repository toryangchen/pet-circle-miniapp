import { NOTIFICATION_CARDS } from '../../utils/mock';

Page({
  data: {
    title: '消息',
    unreadCount: 2,
    notifications: NOTIFICATION_CARDS,
  },

  openConversation() {
    wx.navigateTo({
      url: '/pages/detail/service/index',
    });
  },
});
