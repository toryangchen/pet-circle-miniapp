import type { MiniappUserSummary } from "@utils/api-types";
import { uploadImageToCos } from "@utils/cos-upload";
import { request } from "@utils/request";
import { getAuthState, syncCurrentUser } from "@utils/session";

type EditField = {
  label: string;
  value: string;
  placeholder?: boolean;
  preview?: string;
};

const DEFAULT_AVATAR = "/assets/logo-paw.png";

const BG_TYPE_PREVIEW_MAP: Record<string, string> = {
  "main-bg-01": "linear-gradient(145deg, #35574f 0%, #7fa293 100%)",
  "main-bg-02": "linear-gradient(145deg, #67483d 0%, #d19a74 100%)",
  "main-bg-03": "linear-gradient(145deg, #41506d 0%, #8fb2d9 100%)",
};

function resolveBgPreview(bgType?: string | null) {
  return BG_TYPE_PREVIEW_MAP[bgType || "main-bg-01"] || BG_TYPE_PREVIEW_MAP["main-bg-01"];
}

function formatRegion(user: MiniappUserSummary | null) {
  const parts = [
    user?.region.province,
    user?.region.city,
    user?.region.district,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : "选择地区";
}

function buildBasicFields(user: MiniappUserSummary | null): EditField[] {
  return [
    { label: "昵称", value: user?.nickname || "宠友圈用户" },
    {
      label: "手机号",
      value: user?.phoneMasked || "未绑定",
      placeholder: !user?.phoneMasked,
    },
    {
      label: "背景图",
      value: user?.bgType || "main-bg-01",
      preview: resolveBgPreview(user?.bgType),
    },
  ];
}

function buildExtraFields(user: MiniappUserSummary | null): EditField[] {
  return [
    { label: "性别", value: user?.gender || "保密" },
    {
      label: "生日",
      value: user?.birthday || "选择生日",
      placeholder: !user?.birthday,
    },
    {
      label: "地区",
      value: formatRegion(user),
      placeholder: !user?.region.province && !user?.region.city && !user?.region.district,
    },
  ];
}

Page({
  data: {
    avatar: DEFAULT_AVATAR,
    avatarHint: "点击更换头像",
    basicFields: buildBasicFields(null),
    extraFields: buildExtraFields(null),
    footerTip:
      "资料会影响你在服务信息中的展示方式，建议优先完善头像、昵称和地区。",
    isLoading: false,
    isUploadingAvatar: false,
  },

  onLoad() {
    this.applyUserProfile(getAuthState().user);
    void this.loadUserProfile();
  },

  applyUserProfile(user: MiniappUserSummary | null) {
    this.setData({
      avatar: user?.avatarUrl || DEFAULT_AVATAR,
      basicFields: buildBasicFields(user),
      extraFields: buildExtraFields(user),
    });
  },

  async loadUserProfile() {
    this.setData({ isLoading: true });

    try {
      const user = await syncCurrentUser({ allowRelogin: true });
      this.applyUserProfile(user);
    } catch {
      wx.showToast({
        title: "资料加载失败",
        icon: "none",
      });
    } finally {
      this.setData({ isLoading: false });
    }
  },

  async handleAvatarTap() {
    if (this.data.isUploadingAvatar) {
      return;
    }

    try {
      const image = await this.pickAvatarImage();
      if (!image) {
        return;
      }

      this.setData({ isUploadingAvatar: true });

      const uploadResult = await uploadImageToCos({
        kind: "avatar",
        filePath: image.path,
        filename: image.name,
      });

      await request({
        method: "PATCH",
        path: "/users/me/profile",
        data: {
          avatarUrl: uploadResult.url,
        },
      });

      this.setData({ avatar: uploadResult.url });
      await this.loadUserProfile();
      wx.showToast({
        title: "头像已更新",
        icon: "success",
      });
    } catch {
      wx.showToast({
        title: "头像上传失败",
        icon: "none",
      });
    } finally {
      this.setData({ isUploadingAvatar: false });
    }
  },

  pickAvatarImage(): Promise<{ path: string; name?: string } | null> {
    return new Promise((resolve, reject) => {
      wx.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
        success: (result) => {
          const selectedFile = result.tempFiles?.[0];
          if (!selectedFile?.path) {
            resolve(null);
            return;
          }

          resolve({
            path: selectedFile.path,
            name: selectedFile.path.split("/").pop(),
          });
        },
        fail: (error) => {
          const errMsg = (error as { errMsg?: string }).errMsg || "";
          if (errMsg.includes("cancel")) {
            resolve(null);
            return;
          }

          reject(error);
        },
      });
    });
  },

  handleFieldTap(event: WechatMiniprogram.BaseEvent) {
    const { label } = event.currentTarget.dataset as { label?: string };
    if (!label) {
      return;
    }

    wx.showToast({
      title: `${label}编辑能力开发中`,
      icon: "none",
    });
  },
});
