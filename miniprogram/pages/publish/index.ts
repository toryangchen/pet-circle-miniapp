type PublishTab = "PET_SOCIAL" | "FOSTER" | "HOME_VISIT" | "RESALE";
type StructuredPublishTab = Exclude<PublishTab, "PET_SOCIAL">;
type FieldInputType = "text" | "textarea" | "picker";
type PublishFieldKey =
  | "fosterPetType"
  | "fosterNeed"
  | "fosterPickup"
  | "fosterBudget"
  | "homeVisitArea"
  | "homeVisitTime"
  | "homeVisitPrice"
  | "homeVisitDescription"
  | "resaleItem"
  | "resaleCondition"
  | "resalePrice"
  | "resaleDelivery";

type FieldConfig = {
  key: PublishFieldKey;
  label: string;
  placeholder: string;
  inputType: FieldInputType;
  options?: string[];
};

type FieldValues = Record<PublishFieldKey, string>;
type FieldView = FieldConfig & {
  value: string;
  isActive: boolean;
};

const tabs = [
  { key: "PET_SOCIAL", label: "#宠物圈" },
  { key: "FOSTER", label: "#寄养领养" },
  { key: "HOME_VISIT", label: "#上门喂养" },
  { key: "RESALE", label: "#二手闲置" },
];

const fieldGroups: Record<StructuredPublishTab, FieldConfig[]> = {
  FOSTER: [
    {
      key: "fosterPetType",
      label: "宠物类型",
      placeholder: "猫咪",
      inputType: "picker",
      options: ["猫咪", "狗狗", "异宠", "其他"],
    },
    {
      key: "fosterNeed",
      label: "服务诉求",
      placeholder: "找人帮忙照看",
      inputType: "text",
    },
    {
      key: "fosterPickup",
      label: "是否可上门",
      placeholder: "可商议",
      inputType: "picker",
      options: ["可商议", "可上门接送", "需自行送宠"],
    },
    {
      key: "fosterBudget",
      label: "预算范围",
      placeholder: "300元/天起",
      inputType: "text",
    },
  ],
  HOME_VISIT: [
    {
      key: "homeVisitArea",
      label: "服务区域",
      placeholder: "雁塔区附近优先",
      inputType: "text",
    },
    {
      key: "homeVisitTime",
      label: "可上门时间",
      placeholder: "工作日晚间 / 周末全天",
      inputType: "text",
    },
    {
      key: "homeVisitPrice",
      label: "参考价格",
      placeholder: "80元 / 次",
      inputType: "text",
    },
    {
      key: "homeVisitDescription",
      label: "服务说明",
      placeholder: "喂饭、换水、清理砂盆",
      inputType: "textarea",
    },
  ],
  RESALE: [
    {
      key: "resaleItem",
      label: "闲置物品",
      placeholder: "猫抓板 / 猫爬架 / 宠物包",
      inputType: "text",
    },
    {
      key: "resaleCondition",
      label: "新旧程度",
      placeholder: "9成新，功能完好",
      inputType: "text",
    },
    {
      key: "resalePrice",
      label: "价格",
      placeholder: "120元，可小刀",
      inputType: "text",
    },
    {
      key: "resaleDelivery",
      label: "交易方式",
      placeholder: "西安同城自提 / 核验自取",
      inputType: "text",
    },
  ],
};

const emptyFieldValues: FieldValues = {
  fosterPetType: "",
  fosterNeed: "",
  fosterPickup: "",
  fosterBudget: "",
  homeVisitArea: "",
  homeVisitTime: "",
  homeVisitPrice: "",
  homeVisitDescription: "",
  resaleItem: "",
  resaleCondition: "",
  resalePrice: "",
  resaleDelivery: "",
};

function buildFieldViews(currentTab: PublishTab, values: FieldValues, activeFieldKey: string) {
  if (currentTab === "PET_SOCIAL") {
    return [] as FieldView[];
  }

  return fieldGroups[currentTab].map((field) => ({
    ...field,
    value: values[field.key],
    isActive: activeFieldKey === field.key,
  }));
}

function isPublishEnabled(currentTab: PublishTab, titleInput: string, contentInput: string, values: FieldValues) {
  if (!titleInput.trim() || !contentInput.trim()) {
    return false;
  }

  if (currentTab === "PET_SOCIAL") {
    return true;
  }

  return fieldGroups[currentTab].every((field) => values[field.key].trim());
}

function findFieldConfig(currentTab: PublishTab, fieldKey: string) {
  if (currentTab === "PET_SOCIAL") {
    return null;
  }

  return fieldGroups[currentTab].find((field) => field.key === fieldKey) ?? null;
}

Page({
  data: {
    title: "发布",
    currentTab: "PET_SOCIAL" as PublishTab,
    tabs,
    titleInput: "",
    contentInput: "",
    fieldValues: emptyFieldValues,
    fieldGroups,
    currentFields: [] as FieldView[],
    activeFieldKey: "",
    activeFieldLabel: "",
    activeFieldValue: "",
    activeFieldPlaceholder: "",
    activeFieldOptions: [] as string[],
    activeFieldOptionIndex: 0,
    activeFieldInputType: "text" as FieldInputType,
    isPublishEnabled: false,
  },

  onLoad() {
    this.refreshFieldViews("PET_SOCIAL", emptyFieldValues, "", "", "");
  },

  switchTab(event: WechatMiniprogram.BaseEvent) {
    const { key } = event.currentTarget.dataset as { key?: PublishTab };
    if (!key) {
      return;
    }

    this.refreshFieldViews(
      key,
      this.data.fieldValues as FieldValues,
      this.data.titleInput as string,
      this.data.contentInput as string,
      "",
    );
  },

  handleTitleInput(event: WechatMiniprogram.CustomEvent<{ value?: string }>) {
    const titleInput = event.detail.value ?? "";
    this.refreshFieldViews(
      this.data.currentTab as PublishTab,
      this.data.fieldValues as FieldValues,
      titleInput,
      this.data.contentInput as string,
      this.data.activeFieldKey as string,
    );
  },

  handleContentInput(event: WechatMiniprogram.CustomEvent<{ value?: string }>) {
    const contentInput = event.detail.value ?? "";
    this.refreshFieldViews(
      this.data.currentTab as PublishTab,
      this.data.fieldValues as FieldValues,
      this.data.titleInput as string,
      contentInput,
      this.data.activeFieldKey as string,
    );
  },

  activateField(event: WechatMiniprogram.BaseEvent) {
    const { fieldKey } = event.currentTarget.dataset as { fieldKey?: string };
    const currentTab = this.data.currentTab as PublishTab;
    if (!fieldKey || currentTab === "PET_SOCIAL") {
      return;
    }

    const field = findFieldConfig(currentTab, fieldKey);
    if (!field) {
      return;
    }

    const fieldValues = this.data.fieldValues as FieldValues;
    const activeFieldValue = fieldValues[field.key];
    const activeFieldOptions = field.options ?? [];

    this.setData({
      activeFieldKey: field.key,
      activeFieldLabel: field.label,
      activeFieldValue,
      activeFieldPlaceholder: field.placeholder,
      activeFieldOptions,
      activeFieldOptionIndex: Math.max(activeFieldOptions.indexOf(activeFieldValue), 0),
      activeFieldInputType: field.inputType,
      currentFields: buildFieldViews(currentTab, fieldValues, field.key),
    });
  },

  handleFieldInput(event: WechatMiniprogram.CustomEvent<{ value?: string }>) {
    const value = event.detail.value ?? "";
    const activeFieldKey = this.data.activeFieldKey as PublishFieldKey | "";
    if (!activeFieldKey) {
      return;
    }

    const nextValues = {
      ...(this.data.fieldValues as FieldValues),
      [activeFieldKey]: value,
    };

    this.refreshFieldViews(
      this.data.currentTab as PublishTab,
      nextValues,
      this.data.titleInput as string,
      this.data.contentInput as string,
      activeFieldKey,
    );
  },

  handleFieldPickerChange(event: WechatMiniprogram.CustomEvent<{ value?: string | number }>) {
    const activeFieldKey = this.data.activeFieldKey as PublishFieldKey | "";
    if (!activeFieldKey) {
      return;
    }

    const options = this.data.activeFieldOptions as string[];
    const optionIndex = Number(event.detail.value ?? 0);
    const nextValue = options[optionIndex] ?? "";
    const nextValues = {
      ...(this.data.fieldValues as FieldValues),
      [activeFieldKey]: nextValue,
    };

    this.refreshFieldViews(
      this.data.currentTab as PublishTab,
      nextValues,
      this.data.titleInput as string,
      this.data.contentInput as string,
      activeFieldKey,
    );

    this.setData({
      activeFieldOptionIndex: optionIndex,
    });
  },

  finishFieldEdit() {
    this.refreshFieldViews(
      this.data.currentTab as PublishTab,
      this.data.fieldValues as FieldValues,
      this.data.titleInput as string,
      this.data.contentInput as string,
      "",
    );
  },

  handleImageTap() {
    wx.showToast({
      title: "界面预览版，暂未接入图片上传",
      icon: "none",
    });
  },

  previewPublish() {
    if (!(this.data.isPublishEnabled as boolean)) {
      wx.showToast({
        title: "请先补全内容",
        icon: "none",
      });
      return;
    }

    wx.showToast({
      title: "界面预览版，暂未接入发布",
      icon: "none",
    });
  },

  refreshFieldViews(
    currentTab: PublishTab,
    values: FieldValues,
    titleInput: string,
    contentInput: string,
    activeFieldKey: string,
  ) {
    const field = findFieldConfig(currentTab, activeFieldKey);
    const activeFieldOptions = field?.options ?? [];
    const activeFieldValue = field && activeFieldKey ? values[field.key] : "";

    this.setData({
      currentTab,
      titleInput,
      contentInput,
      fieldValues: values,
      currentFields: buildFieldViews(currentTab, values, activeFieldKey),
      activeFieldKey,
      activeFieldLabel: field?.label ?? "",
      activeFieldPlaceholder: field?.placeholder ?? "",
      activeFieldOptions,
      activeFieldOptionIndex: Math.max(activeFieldOptions.indexOf(activeFieldValue), 0),
      activeFieldInputType: field?.inputType ?? "text",
      activeFieldValue,
      isPublishEnabled: isPublishEnabled(currentTab, titleInput, contentInput, values),
    });
  },
});
