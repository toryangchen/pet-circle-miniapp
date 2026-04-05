Component({
  data: {
    selected: 0,
    list: [
      { pagePath: "/pages/tabbar/home/index", text: "首页" },
      { pagePath: "/pages/tabbar/service/index", text: "服务" },
      { pagePath: "", text: "发布" },
      { pagePath: "/pages/tabbar/message/index", text: "消息" },
      { pagePath: "/pages/tabbar/personal/index", text: "我的" },
    ],
  },
  attached() {},
  methods: {
    switchTab(e: WechatMiniprogram.BaseEvent) {
      const { path: url } = e.currentTarget.dataset;
      if (!url) {
        return;
      }
      wx.switchTab({ url });
    },
  },
});
