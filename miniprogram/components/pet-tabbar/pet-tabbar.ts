import { MAIN_TABS } from '../../utils/mock';

Component({
  properties: {
    current: {
      type: String,
      value: 'home',
    },
  },
  data: {
    leftItems: MAIN_TABS.filter((item) => item.key === 'home' || item.key === 'service'),
    rightItems: MAIN_TABS.filter((item) => item.key === 'message' || item.key === 'my'),
  },
  methods: {
    onTabTap(event: WechatMiniprogram.TouchEvent) {
      const { route } = event.currentTarget.dataset as { route?: string };
      if (!route) {
        return;
      }

      wx.reLaunch({
        url: route,
      });
    },

    onPublishTap() {
      wx.reLaunch({
        url: '/pages/publish/index',
      });
    },

  },
});
