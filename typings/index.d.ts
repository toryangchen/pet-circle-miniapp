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

declare module "cos-wx-sdk-v5" {
  type AuthorizationResult = {
    TmpSecretId: string;
    TmpSecretKey: string;
    SecurityToken: string;
    StartTime: number;
    ExpiredTime: number;
  };

  type CosInstanceOptions = {
    SimpleUploadMethod?: "putObject" | "postObject";
    getAuthorization?: (
      options: unknown,
      callback: (payload: AuthorizationResult) => void,
    ) => void;
  };

  type PutObjectOptions = {
    Bucket: string;
    Region: string;
    Key: string;
    FilePath: string;
  };

  export default class COS {
    constructor(options?: CosInstanceOptions);
    putObject(
      options: PutObjectOptions,
      callback: (error: unknown, data?: unknown) => void,
    ): void;
  }
}
