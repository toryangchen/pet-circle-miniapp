import type { MiniappUserSummary, UpdateMyProfilePayload } from "@utils/api-types";
import { uploadImageToCos } from "@utils/cos-upload";
import { request } from "@utils/request";
import { ensurePhoneAuthorized, getAuthState, syncCurrentUser } from "@utils/session";
import { resolveUploadableFilePath } from "@utils/util";

type EditField = {
  type: string;
  label: string;
  value: string;
  placeholder?: boolean;
  preview?: string;
};

type BgTypeOption = {
  value: string;
  label: string;
  description: string;
  preview: string;
};

function getFileNameWithoutExt(url: string): string {
  const fileName = url.split("/").pop() || "";
  const index = fileName.lastIndexOf(".");
  return index !== -1 ? fileName.slice(0, index) : fileName;
}

const DEFAULT_AVATAR = "/assets/profile-pawpets-avatar.png";
const BG_TYPE_OPTIONS: BgTypeOption[] = [
  {
    value: "main-bg-01",
    label: "森林薄雾",
    description: "偏自然的绿色层次，适合宠物日常分享。",
    preview: "/assets/main-bg-01.png",
  },
  {
    value: "main-bg-02",
    label: "暖阳琥珀",
    description: "暖棕和金色过渡，更有陪伴感。",
    preview: "/assets/main-bg-02.png",
  },
  {
    value: "main-bg-03",
    label: "晴空海盐",
    description: "偏清爽的蓝色氛围，画面更轻盈。",
    preview: "/assets/main-bg-03.png",
  },
];

function resolveBgPreview(bgType?: string | null) {
  return bgType ? `/assets/${bgType}.png` : "/assets/main-bg-01.png";
}

function formatRegion(user: MiniappUserSummary | null) {
  const parts = [user?.region.province, user?.region.city, user?.region.district].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : "选择地区";
}

function buildBasicFields(user: MiniappUserSummary | null): EditField[] {
  return [
    { type: "nickname", label: "昵称", value: user?.nickname || "" },
    {
      type: "phoneMasked",
      label: "手机号",
      value: user?.phoneMasked || "",
      placeholder: !user?.phoneMasked,
    },
    {
      type: "bgType",
      label: "背景图",
      value: user?.bgType || "main-bg-01",
      preview: resolveBgPreview(user?.bgType),
    },
  ];
}

function buildExtraFields(user: MiniappUserSummary | null): EditField[] {
  return [
    { type: "gender", label: "性别", value: user?.gender || "保密" },
    {
      type: "birthday",
      label: "生日",
      value: user?.birthday || "选择生日",
      placeholder: !user?.birthday,
    },
    {
      type: "area",
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
    footerTip: "资料会影响你在服务信息中的展示方式，建议优先完善头像、昵称和地区。",
    isLoading: false,
    isUploadingAvatar: false,
    isAuthorizingPhone: false,
    isBgTypeSheetVisible: false,
    pendingBgType: "main-bg-01",
    bgTypeOptions: BG_TYPE_OPTIONS,
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
      pendingBgType: user?.bgType || "main-bg-01",
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

  async updateUserProfile(payload: UpdateMyProfilePayload) {
    return request({
      method: "PATCH",
      path: "/users/me/profile",
      data: payload,
    });
  },

  async onChooseAvatar(event: WechatMiniprogram.CustomEvent) {
    const { avatarUrl } = event.detail as { avatarUrl?: string };
    if (!avatarUrl || this.data.isUploadingAvatar) {
      return;
    }
    try {
      this.setData({ isUploadingAvatar: true });
      const filePath = await resolveUploadableFilePath(avatarUrl);
      const uploadResult = await uploadImageToCos({
        kind: "avatar",
        filePath,
        filename: `${getFileNameWithoutExt(avatarUrl) || "avatar"}.png`,
      });
      await this.updateUserProfile({
        avatarUrl: uploadResult.url,
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

  async bindNickNameInput(event: WechatMiniprogram.InputConfirm) {
    const { value } = event.detail;
    if (!value) return;
    await this.updateUserProfile({ nickname: value });
    void this.loadUserProfile();
  },

  async getPhoneNumber(event: WechatMiniprogram.CustomEvent) {
    const { code, errMsg } = event.detail as { code?: string; errMsg?: string };
    if (!code || this.data.isAuthorizingPhone) {
      if (errMsg && !errMsg.includes("cancel")) {
        wx.showToast({
          title: "手机号授权失败",
          icon: "none",
        });
      }
      return;
    }

    try {
      this.setData({ isAuthorizingPhone: true });
      await ensurePhoneAuthorized(code);
      await this.loadUserProfile();
      wx.showToast({
        title: "手机号已绑定",
        icon: "success",
      });
    } catch (error) {
      wx.showToast({
        title: error instanceof Error ? error.message : "手机号授权失败",
        icon: "none",
      });
    } finally {
      this.setData({ isAuthorizingPhone: false });
    }
  },

  handleFieldTap(event: WechatMiniprogram.BaseEvent) {
    const { type } = event.currentTarget.dataset as { type?: string };
    if (!type) {
      return;
    }

     if (type === "bgType") {
      const currentBgType = (getAuthState().user?.bgType || this.data.pendingBgType || "main-bg-01") as string;
      this.setData({
        isBgTypeSheetVisible: true,
        pendingBgType: currentBgType,
      });
    }
  },

  handleBgTypeSheetClose() {
    this.setData({
      isBgTypeSheetVisible: false,
    });
  },

  handleBgTypeChange(event: WechatMiniprogram.CustomEvent<{ value?: string }>) {
    const { value } = event.detail;
    if (!value) {
      return;
    }

    this.setData({
      pendingBgType: value,
    });
  },

  async handleBgTypeConfirm() {
    const nextBgType = this.data.pendingBgType as string;
    const currentBgType = getAuthState().user?.bgType || "main-bg-01";

    if (nextBgType === currentBgType) {
      this.setData({
        isBgTypeSheetVisible: false,
      });
      return;
    }

    try {
      await this.updateUserProfile({
        bgType: nextBgType,
      });
      this.setData({
        isBgTypeSheetVisible: false,
      });
      await this.loadUserProfile();
      wx.showToast({
        title: "背景图已更新",
        icon: "success",
      });
    } catch (error) {
      wx.showToast({
        title: error instanceof Error ? error.message : "背景图更新失败",
        icon: "none",
      });
    }
  },
});
