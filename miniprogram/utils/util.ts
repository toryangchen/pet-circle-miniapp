export const formatTime = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  return (
    [year, month, day].map(formatNumber).join("/") +
    " " +
    [hour, minute, second].map(formatNumber).join(":")
  );
};

const formatNumber = (n: number) => {
  const s = n.toString();
  return s[1] ? s : "0" + s;
};

export const getNavbarHeight = () => {
  // 获取系统信息
  const windowInfo = wx.getWindowInfo();
  // 胶囊按钮位置信息
  const menuButtonInfo = wx.getMenuButtonBoundingClientRect();

  return {
    statusHeight: windowInfo.statusBarHeight,
    navBarHeight: (menuButtonInfo.top - windowInfo.statusBarHeight) * 2 + menuButtonInfo.height,
    menuRight: windowInfo.screenWidth - menuButtonInfo.right,
    menuTop: menuButtonInfo.top,
    menuHeight: menuButtonInfo.height,
  };
};

export const resolveUploadableFilePath = (src: string): Promise<string> => {
  if (!src.startsWith("http://tmp/") && !src.startsWith("https://tmp/")) {
    return Promise.resolve(src);
  }
  return new Promise((resolve, reject) => {
    wx.getImageInfo({
      src,
      success: (result) => {
        if (result.path) {
          resolve(result.path);
          return;
        }
        reject(new Error("Avatar temp path is missing."));
      },
      fail: (error) => {
        reject(error);
      },
    });
  });
};
