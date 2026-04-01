import { HOME_FEEDS, HOME_TAGS } from '../../utils/mock';

Page({
  data: {
    location: '西安',
    title: '宠友圈',
    heroTitle: '今天值得被分享的宠物日常',
    heroSummary: '用更轻盈的浏览体验看见小猫小狗、领养故事和城市里的温柔瞬间。',
    tags: HOME_TAGS,
    featuredPosts: HOME_FEEDS,
  },

  onTapPost(event: WechatMiniprogram.BaseEvent) {
    const { route } = event.currentTarget.dataset as { route?: string };
    if (!route) {
      return;
    }

    wx.navigateTo({
      url: route,
    });
  },

  goService() {
    wx.reLaunch({
      url: '/pages/service/index',
    });
  },
});
