Page({
  data: {
    title: '详情',
    authorName: '雪球',
  },

  goBack() {
    wx.navigateBack({
      delta: 1,
    });
  },
});
