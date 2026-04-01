Page({
  data: {
    title: '详情',
    authorName: '糯米和团子的家',
  },

  goBack() {
    wx.navigateBack({
      delta: 1,
    });
  },
});
