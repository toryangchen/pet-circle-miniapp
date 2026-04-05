Component({
  properties: {
    background: {
      type: String,
      value: "#ffffff",
    },
    color: {
      type: String,
      value: "#000000",
    },
    back: {
      type: Boolean,
      value: false,
    },
    title: {
      type: String,
      value: "",
    },
  },
  /**
   * 组件的初始数据
   */
  data: {
    statusBarHeight: 0, // 状态栏高度
    navBarHeight: 0, // 导航栏高度
    menuRight: 0, // 胶囊距右方间距（方保持左、右间距一致）
    menuTop: 0, // 胶囊距底部间距（保持底部间距一致）
    menuHeight: 0, // 胶囊高度（自定义内容可与胶囊高度保证一致）
  },
  lifetimes: {
    attached() {
      // 获取系统信息
      const windowInfo = wx.getWindowInfo();
      // 胶囊按钮位置信息
      const menuButtonInfo = wx.getMenuButtonBoundingClientRect();

      this.setData({
        statusHeight: windowInfo.statusBarHeight,
        navBarHeight: (menuButtonInfo.top - windowInfo.statusBarHeight) * 2 + menuButtonInfo.height,
        menuRight: windowInfo.screenWidth - menuButtonInfo.right,
        menuTop: menuButtonInfo.top,
        menuHeight: menuButtonInfo.height,
      });
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    goBack() {
      wx.navigateBack();
    },
  },
});
