type EditField = {
  label: string;
  value: string;
  placeholder?: boolean;
  preview?: string;
};

Page({
  data: {
    avatar: "/assets/logo-paw.png",
    avatarHint: "点击更换头像",
    basicFields: [
      { label: "昵称", value: "糯米和团子的家" },
      { label: "手机号", value: "138****2048" },
      {
        label: "背景图",
        value: "",
        preview: "linear-gradient(145deg, #35574f 0%, #7fa293 100%)",
      },
    ] as EditField[],
    extraFields: [
      { label: "性别", value: "保密" },
      { label: "生日", value: "选择生日", placeholder: true },
      { label: "地区", value: "西安 · 雁塔区" },
    ] as EditField[],
    footerTip:
      "资料会影响你在服务信息中的展示方式，建议优先完善头像、昵称和地区。",
  },

  handleAvatarTap() {
    wx.showToast({
      title: "头像更换能力开发中",
      icon: "none",
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
