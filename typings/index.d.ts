/// <reference path="../node_modules/miniprogram-api-typings/index.d.ts" />

interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo;
  };
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback;
}

declare namespace WechatMiniprogram {
  interface BaseEvent extends Event {}

  interface CustomEvent<TDetail = Record<string, unknown>> extends Event {
    detail: TDetail;
  }

  interface TouchEvent extends Event {}
}
