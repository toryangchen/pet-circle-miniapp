import { SERVICE_FEEDS, SERVICE_TAGS, SERVICE_TABS } from '../../utils/mock';

Page({
  data: {
    location: '西安',
    title: '服务',
    tabs: SERVICE_TABS,
    currentTab: 0,
    tags: SERVICE_TAGS,
    highlightTitle: '在西安找到更靠谱的宠物帮助',
    highlightSummary: '寄养、领养、上门喂养和闲置发布都用更清晰的卡片结构呈现。',
    servicePosts: SERVICE_FEEDS,
  },

  switchTab(event: WechatMiniprogram.BaseEvent) {
    const { index } = event.currentTarget.dataset as { index?: number };
    const nextIndex = Number(index);
    if (!Number.isFinite(nextIndex)) {
      return;
    }

    this.setData({
      currentTab: nextIndex,
    });
  },

  openDetail(event: WechatMiniprogram.BaseEvent) {
    const { route } = event.currentTarget.dataset as { route?: string };
    if (!route) {
      return;
    }

    wx.navigateTo({
      url: route,
    });
  },
});
