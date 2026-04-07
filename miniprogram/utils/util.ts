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
  }
}