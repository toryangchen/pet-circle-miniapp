import type { PublishResult } from "@utils/api-types";
import { requestWithAuth } from "@utils/request";
import { getAuthState } from "@utils/session";
import { uploadImageToCos } from "@utils/cos-upload";
import { resolveUploadableFilePath, rpx2px } from "@utils/util";

type PublishTab = "PET_SOCIAL" | "ADOPTION_FOSTER" | "HOME_VISIT" | "OTHER";
type StructuredPublishTab = Exclude<PublishTab, "PET_SOCIAL">;
type FieldInputType = "text" | "textarea" | "picker" | "multiPicker";
type UploadStatus = "uploading" | "success" | "error";
type PublishFieldKey =
  | "adoptionFosterProfile"
  | "adoptionFosterMode"
  | "adoptionFosterPetType"
  | "adoptionFosterAge"
  | "adoptionFosterGender"
  | "adoptionFosterNeutered"
  | "adoptionFosterRequirement"
  | "homeVisitArea"
  | "homeVisitTime"
  | "homeVisitDescription"
  | "homeVisitPrice"
  | "otherType"
  | "otherArea"
  | "otherBudget"
  | "otherDescription";

type FieldConfig = {
  key: PublishFieldKey;
  label: string;
  placeholder: string;
  inputType: FieldInputType;
  options?: string[];
  keys?: PublishFieldKey[];
  columns?: string[][];
};

type FieldValues = Record<PublishFieldKey, string>;
type FieldView = FieldConfig & {
  value: string;
  optionIndex: number;
  optionIndexes: number[];
};

type PublishImageItem = {
  id: string;
  previewUrl: string;
  url: string;
  uploadStatus: UploadStatus;
};

type TouchPoint = {
  clientX?: number;
  pageX?: number;
};

type GridRect = {
  left: number;
  width: number;
};

const MAX_UPLOAD_IMAGES = 3;
const IMAGE_COMPRESS_QUALITY = 80;
const IMAGE_GAP_RPX = 12;
const IMAGE_SOURCE_OPTIONS = ["从相册选择", "拍照"] as const;
const HOME_FEED_REFRESH_FLAG = "home_feed_needs_refresh";
const SERVICE_FEED_REFRESH_FLAG = "service_feed_needs_refresh";

let imageIdSeed = 0;

const tabs = [
  { key: "PET_SOCIAL", label: "#宠物圈" },
  { key: "ADOPTION_FOSTER", label: "#领养寄养" },
  { key: "HOME_VISIT", label: "#上门喂养" },
  { key: "OTHER", label: "#其它" },
];

const fieldGroups: Record<StructuredPublishTab, FieldConfig[]> = {
  ADOPTION_FOSTER: [
    {
      key: "adoptionFosterMode",
      label: "需求类型",
      placeholder: "领养",
      inputType: "picker",
      options: ["领养", "寄养"],
    },
    {
      key: "adoptionFosterProfile",
      keys: ["adoptionFosterPetType", "adoptionFosterAge", "adoptionFosterGender"],
      label: "宠物信息",
      placeholder: "猫咪 / 幼年 / 未知",
      inputType: "multiPicker",
      columns: [
        ["猫咪", "狗狗", "其他"],
        ["幼年", "成年", "老年", "不确定"],
        ["未知", "公", "母"],
      ],
    },
    {
      key: "adoptionFosterNeutered",
      label: "是否绝育",
      placeholder: "未绝育",
      inputType: "picker",
      options: ["已绝育", "未绝育", "不确定"],
    },
    {
      key: "adoptionFosterRequirement",
      label: "费用/要求",
      placeholder: "免费领养 / 30元每天 / 希望有养宠经验",
      inputType: "textarea",
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
      key: "homeVisitDescription",
      label: "服务内容",
      placeholder: "喂饭、换水、清理砂盆",
      inputType: "textarea",
    },
    {
      key: "homeVisitPrice",
      label: "参考价格",
      placeholder: "80元 / 次",
      inputType: "text",
    },
  ],
  OTHER: [
    {
      key: "otherType",
      label: "信息类型",
      placeholder: "求助",
      inputType: "picker",
      options: ["求助", "组局", "闲置", "其它"],
    },
    {
      key: "otherArea",
      label: "所在区域",
      placeholder: "雁塔区 / 高新区 / 可线上沟通",
      inputType: "text",
    },
    {
      key: "otherBudget",
      label: "预算/价格",
      placeholder: "可商议 / 50元以内 / 免费",
      inputType: "text",
    },
    {
      key: "otherDescription",
      label: "补充说明",
      placeholder: "说明具体需求、规则或注意事项",
      inputType: "textarea",
    },
  ],
};

const emptyFieldValues: FieldValues = {
  adoptionFosterProfile: "",
  adoptionFosterMode: "",
  adoptionFosterPetType: "",
  adoptionFosterAge: "",
  adoptionFosterGender: "",
  adoptionFosterNeutered: "",
  adoptionFosterRequirement: "",
  homeVisitArea: "",
  homeVisitTime: "",
  homeVisitDescription: "",
  homeVisitPrice: "",
  otherType: "",
  otherArea: "",
  otherBudget: "",
  otherDescription: "",
};

function buildFieldViews(currentTab: PublishTab, values: FieldValues) {
  if (currentTab === "PET_SOCIAL") {
    return [] as FieldView[];
  }

  return fieldGroups[currentTab].map((field) => ({
    ...field,
    value:
      field.inputType === "multiPicker"
        ? resolveMultiPickerValue(field, values)
        : values[field.key],
    optionIndex: Math.max((field.options ?? []).indexOf(values[field.key]), 0),
    optionIndexes: resolveMultiPickerIndexes(field, values),
  }));
}

function resolveMultiPickerValue(field: FieldConfig, values: FieldValues) {
  if (!field.keys?.length) {
    return values[field.key];
  }

  const selectedValues = field.keys.map((key) => values[key]).filter(Boolean);
  return selectedValues.length === field.keys.length ? selectedValues.join(" / ") : "";
}

function resolveMultiPickerIndexes(field: FieldConfig, values: FieldValues) {
  if (!field.keys?.length || !field.columns?.length) {
    return [];
  }

  return field.keys.map((key, index) => {
    const column = field.columns?.[index] ?? [];
    return Math.max(column.indexOf(values[key]), 0);
  });
}

function findFieldConfig(currentTab: PublishTab, fieldKey: string) {
  if (currentTab === "PET_SOCIAL") {
    return null;
  }

  return fieldGroups[currentTab].find((field) => field.key === fieldKey) ?? null;
}

function getUploadedImages(imageList: PublishImageItem[]) {
  return imageList.filter((item) => item.uploadStatus === "success" && item.url);
}

function isFieldComplete(field: FieldConfig, values: FieldValues) {
  if (field.inputType === "multiPicker") {
    return Boolean(field.keys?.every((key) => values[key].trim()));
  }

  return Boolean(values[field.key].trim());
}

function isPublishEnabled(
  currentTab: PublishTab,
  titleInput: string,
  contentInput: string,
  values: FieldValues,
  imageList: PublishImageItem[],
) {
  if (!titleInput.trim() || !contentInput.trim()) {
    return false;
  }

  if (!getUploadedImages(imageList).length) {
    return false;
  }

  if (imageList.some((item) => item.uploadStatus !== "success")) {
    return false;
  }

  if (currentTab === "PET_SOCIAL") {
    return true;
  }

  return fieldGroups[currentTab].every((field) => isFieldComplete(field, values));
}

function createImageItem(filePath: string): PublishImageItem {
  imageIdSeed += 1;
  return {
    id: `publish-image-${imageIdSeed}`,
    previewUrl: filePath,
    url: "",
    uploadStatus: "uploading",
  };
}

function reorderImages(items: PublishImageItem[], fromIndex: number, toIndex: number) {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length
  ) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
}

function resolvePostCity() {
  return getAuthState().user?.region.city || "西安";
}

function buildPublishPayload(
  currentTab: PublishTab,
  titleInput: string,
  contentInput: string,
  fieldValues: FieldValues,
  uploadedImages: PublishImageItem[],
) {
  const images = uploadedImages.map((item) => item.url);
  const city = resolvePostCity();

  if (currentTab === "PET_SOCIAL") {
    return {
      type: "PET_SOCIAL",
      title: titleInput.trim(),
      content: contentInput.trim(),
      city,
      images: uploadedImages.map((item) => item.url),
    };
  }

  if (currentTab === "ADOPTION_FOSTER") {
    if (fieldValues.adoptionFosterMode === "领养") {
      return {
        type: "SERVICE",
        serviceCategory: fieldValues.adoptionFosterMode === "领养" ? "ADOPTION" : "BOARDING",
        title: titleInput.trim(),
        content:
          `${contentInput.trim()}\n领养要求：${fieldValues.adoptionFosterRequirement}`.trim(),
        city,
        images,
        adoptionDetail: {
          petType: fieldValues.adoptionFosterPetType,
          age: fieldValues.adoptionFosterAge,
          gender: fieldValues.adoptionFosterGender,
          neutered: fieldValues.adoptionFosterNeutered === "已绝育",
          adoptionRequirements: fieldValues.adoptionFosterRequirement,
        },
      };
    }

    return {
      type: "SERVICE",
      serviceCategory: fieldValues.adoptionFosterMode === "领养" ? "ADOPTION" : "BOARDING",
      title: titleInput.trim(),
      content: `${contentInput.trim()}\n寄养要求：${fieldValues.adoptionFosterRequirement}`.trim(),
      city,
      images,
      boardingDetail: {
        boardingEnvironment: `${fieldValues.adoptionFosterAge} · ${fieldValues.adoptionFosterGender} · ${fieldValues.adoptionFosterNeutered}`,
        acceptedPetTypes: [fieldValues.adoptionFosterPetType],
        price: fieldValues.adoptionFosterRequirement,
      },
    };
  }

  if (currentTab === "HOME_VISIT") {
    return {
      type: "SERVICE",
      serviceCategory: "HOME_FEEDING",
      title: titleInput.trim(),
      content: `${contentInput.trim()}\n服务说明：${fieldValues.homeVisitDescription}`.trim(),
      city,
      images,
      homeFeedingDetail: {
        serviceArea: fieldValues.homeVisitArea,
        availableTime: fieldValues.homeVisitTime,
        price: fieldValues.homeVisitPrice,
      },
    };
  }

  return {
    type: "SERVICE",
    serviceCategory: "SECOND_HAND",
    title: titleInput.trim(),
    content: `${contentInput.trim()}\n补充说明：${fieldValues.otherDescription}`.trim(),
    city,
    images,
    secondHandDetail: {
      itemType: fieldValues.otherType,
      itemCondition: fieldValues.otherArea,
      price: fieldValues.otherBudget,
    },
  };
}

function chooseMedia(options: WechatMiniprogram.ChooseMediaOption) {
  return new Promise<WechatMiniprogram.ChooseMediaSuccessCallbackResult>((resolve, reject) => {
    wx.chooseMedia({
      ...options,
      success: resolve,
      fail: reject,
    });
  });
}

function compressPublishImage(filePath: string) {
  return new Promise<string>((resolve) => {
    wx.compressImage({
      src: filePath,
      quality: IMAGE_COMPRESS_QUALITY,
      success: (result) => {
        resolve(result.tempFilePath || filePath);
      },
      fail: () => {
        resolve(filePath);
      },
    });
  });
}

function selectNodeRect(selector: string) {
  return new Promise<GridRect | null>((resolve) => {
    const query = wx.createSelectorQuery();
    query
      .select(selector)
      .boundingClientRect((rect) => {
        if (!rect) {
          resolve(null);
          return;
        }

        resolve({
          left: rect.left,
          width: rect.width,
        });
      })
      .exec();
  });
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
    imageList: [] as PublishImageItem[],
    maxImageCount: MAX_UPLOAD_IMAGES,
    draggingImageId: "",
    isFieldDialogVisible: false,
    fieldEditorKey: "",
    fieldEditorLabel: "",
    fieldEditorValue: "",
    fieldEditorPlaceholder: "",
    fieldEditorInputType: "text" as FieldInputType,
    fieldEditorKeyboardHeight: 0,
    fieldEditorInputFocused: false,
    canConfirmFieldEditor: false,
    isSubmitting: false,
    isPublishEnabled: false,
  },

  gridRect: null as GridRect | null,
  draggingImageIndex: -1,

  onLoad() {
    this.refreshPageData({
      currentTab: "PET_SOCIAL",
      fieldValues: emptyFieldValues,
      titleInput: "",
      contentInput: "",
      imageList: [],
    });
  },

  switchTab(event: WechatMiniprogram.BaseEvent) {
    const { key } = event.currentTarget.dataset as { key?: PublishTab };
    if (!key) {
      return;
    }

    this.refreshPageData({
      currentTab: key,
      fieldValues: this.data.fieldValues as FieldValues,
      titleInput: this.data.titleInput as string,
      contentInput: this.data.contentInput as string,
      imageList: this.data.imageList as PublishImageItem[],
    });
  },

  handleTitleInput(event: WechatMiniprogram.CustomEvent<{ value?: string }>) {
    this.refreshPageData({
      currentTab: this.data.currentTab as PublishTab,
      fieldValues: this.data.fieldValues as FieldValues,
      titleInput: event.detail.value ?? "",
      contentInput: this.data.contentInput as string,
      imageList: this.data.imageList as PublishImageItem[],
    });
  },

  handleContentInput(event: WechatMiniprogram.CustomEvent<{ value?: string }>) {
    this.refreshPageData({
      currentTab: this.data.currentTab as PublishTab,
      fieldValues: this.data.fieldValues as FieldValues,
      titleInput: this.data.titleInput as string,
      contentInput: event.detail.value ?? "",
      imageList: this.data.imageList as PublishImageItem[],
    });
  },

  async handleImageTap() {
    const imageList = this.data.imageList as PublishImageItem[];
    if (imageList.length >= MAX_UPLOAD_IMAGES) {
      wx.showToast({
        title: "最多上传3张图片",
        icon: "none",
      });
      return;
    }

    try {
      const { tapIndex } = await wx.showActionSheet({
        itemList: [...IMAGE_SOURCE_OPTIONS],
      });

      const remainingCount = MAX_UPLOAD_IMAGES - imageList.length;
      const result = await chooseMedia({
        count: remainingCount,
        mediaType: ["image"],
        sourceType: tapIndex === 0 ? ["album"] : ["camera"],
      });

      const tempFiles = (result.tempFiles ?? [])
        .map((file) => file.tempFilePath)
        .filter((filePath): filePath is string => Boolean(filePath));

      if (!tempFiles.length) {
        return;
      }

      const nextItems = tempFiles.map((filePath) => createImageItem(filePath));
      const latestImageList = this.data.imageList as PublishImageItem[];
      const nextImageList = [...latestImageList, ...nextItems].slice(0, MAX_UPLOAD_IMAGES);

      this.refreshPageData({
        currentTab: this.data.currentTab as PublishTab,
        fieldValues: this.data.fieldValues as FieldValues,
        titleInput: this.data.titleInput as string,
        contentInput: this.data.contentInput as string,
        imageList: nextImageList,
      });

      nextItems.forEach((item) => {
        void this.uploadPublishImage(item.id, item.previewUrl);
      });
    } catch (error) {
      const errMsg =
        typeof error === "object" && error && "errMsg" in error ? String(error.errMsg) : "";
      if (errMsg.includes("cancel")) {
        return;
      }

      wx.showToast({
        title: "选择图片失败",
        icon: "none",
      });
    }
  },

  async uploadPublishImage(imageId: string, filePath: string) {
    try {
      const uploadablePath = await resolveUploadableFilePath(filePath);
      const compressedPath = await compressPublishImage(uploadablePath);
      const result = await uploadImageToCos({
        kind: "post-image",
        filePath: compressedPath,
      });

      this.patchImageItem(imageId, {
        uploadStatus: "success",
        url: result.url,
      });
    } catch {
      this.patchImageItem(imageId, {
        uploadStatus: "error",
      });

      wx.showToast({
        title: "图片上传失败",
        icon: "none",
      });
    }
  },

  removeImage(event: WechatMiniprogram.BaseEvent) {
    const { imageId } = event.currentTarget.dataset as { imageId?: string };
    if (!imageId) {
      return;
    }

    const nextImageList = (this.data.imageList as PublishImageItem[]).filter(
      (item) => item.id !== imageId,
    );
    this.refreshPageData({
      currentTab: this.data.currentTab as PublishTab,
      fieldValues: this.data.fieldValues as FieldValues,
      titleInput: this.data.titleInput as string,
      contentInput: this.data.contentInput as string,
      imageList: nextImageList,
    });
  },

  async startImageDrag(event: WechatMiniprogram.BaseEvent) {
    const { imageId, index } = event.currentTarget.dataset as { imageId?: string; index?: number };
    if (!imageId || typeof index !== "number") {
      return;
    }

    this.gridRect = await selectNodeRect("#publish-image-grid");
    this.draggingImageIndex = index;
    this.setData({
      draggingImageId: imageId,
    });
  },

  onImageDragMove(event: WechatMiniprogram.TouchEvent) {
    if (!this.data.draggingImageId || !this.gridRect || this.draggingImageIndex < 0) {
      return;
    }

    const touch = (event.touches && event.touches[0]) as TouchPoint | undefined;
    const pointX = touch?.clientX ?? touch?.pageX;
    if (typeof pointX !== "number") {
      return;
    }

    const gapPx = rpx2px(IMAGE_GAP_RPX);
    const cardWidth = (this.gridRect.width - gapPx * (MAX_UPLOAD_IMAGES - 1)) / MAX_UPLOAD_IMAGES;
    const stride = cardWidth + gapPx;
    const relativeX = Math.max(pointX - this.gridRect.left, 0);
    const maxIndex = (this.data.imageList as PublishImageItem[]).length - 1;
    const nextIndex = Math.max(0, Math.min(maxIndex, Math.floor(relativeX / stride)));

    if (nextIndex === this.draggingImageIndex) {
      return;
    }

    const nextImageList = reorderImages(
      this.data.imageList as PublishImageItem[],
      this.draggingImageIndex,
      nextIndex,
    );

    this.draggingImageIndex = nextIndex;
    this.refreshPageData({
      currentTab: this.data.currentTab as PublishTab,
      fieldValues: this.data.fieldValues as FieldValues,
      titleInput: this.data.titleInput as string,
      contentInput: this.data.contentInput as string,
      imageList: nextImageList,
    });
    this.setData({
      draggingImageId: this.data.draggingImageId,
    });
  },

  finishImageDrag() {
    this.gridRect = null;
    this.draggingImageIndex = -1;
    this.setData({
      draggingImageId: "",
    });
  },

  openFieldDialog(event: WechatMiniprogram.BaseEvent) {
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
    this.setData({
      isFieldDialogVisible: true,
      fieldEditorKey: field.key,
      fieldEditorLabel: field.label,
      fieldEditorValue: fieldValues[field.key],
      fieldEditorPlaceholder: field.placeholder,
      fieldEditorInputType: field.inputType,
      fieldEditorKeyboardHeight: 0,
      fieldEditorInputFocused: true,
      canConfirmFieldEditor: Boolean(fieldValues[field.key].trim()),
    });
  },

  handleDialogFieldInput(event: WechatMiniprogram.CustomEvent<{ value?: string }>) {
    const value = event.detail.value ?? "";
    this.setData({
      fieldEditorValue: value,
      canConfirmFieldEditor: Boolean(value.trim()),
    });
  },

  onFieldEditorKeyboardHeightChange(event: WechatMiniprogram.CustomEvent<{ height?: number }>) {
    this.setData({
      fieldEditorKeyboardHeight: Math.max(0, event.detail.height || 0),
    });
  },

  handleFieldPickerChange(event: WechatMiniprogram.CustomEvent<{ value?: string | number }>) {
    const { fieldKey } = event.currentTarget.dataset as { fieldKey?: PublishFieldKey };
    const currentTab = this.data.currentTab as PublishTab;
    if (!fieldKey || currentTab === "PET_SOCIAL") {
      return;
    }

    const field = findFieldConfig(currentTab, fieldKey);
    if (!field) {
      return;
    }

    const options = field.options ?? [];
    const optionIndex = Number(event.detail.value ?? 0);
    const nextValue = options[optionIndex] ?? "";
    const nextValues = {
      ...(this.data.fieldValues as FieldValues),
      [fieldKey]: nextValue,
    };

    this.refreshPageData({
      currentTab,
      fieldValues: nextValues,
      titleInput: this.data.titleInput as string,
      contentInput: this.data.contentInput as string,
      imageList: this.data.imageList as PublishImageItem[],
    });
  },

  handleFieldMultiPickerChange(
    event: WechatMiniprogram.CustomEvent<{ value?: number[] | string[] }>,
  ) {
    const { fieldKey } = event.currentTarget.dataset as { fieldKey?: PublishFieldKey };
    const currentTab = this.data.currentTab as PublishTab;
    if (!fieldKey || currentTab === "PET_SOCIAL") {
      return;
    }

    const field = findFieldConfig(currentTab, fieldKey);
    if (!field?.keys?.length || !field.columns?.length) {
      return;
    }

    const fieldKeys = field.keys;
    const fieldColumns = field.columns;
    const optionIndexes = (event.detail.value ?? []).map((value) => Number(value));
    const nextValues = { ...(this.data.fieldValues as FieldValues) };

    fieldKeys.forEach((key, columnIndex) => {
      const optionIndex = optionIndexes[columnIndex] ?? 0;
      nextValues[key] = fieldColumns[columnIndex]?.[optionIndex] ?? "";
    });

    this.refreshPageData({
      currentTab,
      fieldValues: nextValues,
      titleInput: this.data.titleInput as string,
      contentInput: this.data.contentInput as string,
      imageList: this.data.imageList as PublishImageItem[],
    });
  },

  noop() {},

  dismissFieldEditor() {
    const keyboardVisible = (this.data.fieldEditorKeyboardHeight as number) > 0;
    if (keyboardVisible) {
      wx.hideKeyboard();
    }

    this.setData({
      isFieldDialogVisible: false,
      fieldEditorKey: "",
      fieldEditorLabel: "",
      fieldEditorValue: "",
      fieldEditorPlaceholder: "",
      fieldEditorInputType: "text",
      fieldEditorKeyboardHeight: 0,
      fieldEditorInputFocused: false,
      canConfirmFieldEditor: false,
    });
  },

  confirmFieldEditor() {
    const fieldEditorKey = this.data.fieldEditorKey as PublishFieldKey | "";
    const fieldEditorValue = this.data.fieldEditorValue as string;
    if (!fieldEditorKey || !fieldEditorValue.trim()) {
      return;
    }

    const nextValues = {
      ...(this.data.fieldValues as FieldValues),
      [fieldEditorKey]: fieldEditorValue,
    };

    this.refreshPageData({
      currentTab: this.data.currentTab as PublishTab,
      fieldValues: nextValues,
      titleInput: this.data.titleInput as string,
      contentInput: this.data.contentInput as string,
      imageList: this.data.imageList as PublishImageItem[],
    });
    this.dismissFieldEditor();
  },

  async previewPublish() {
    if (this.data.isSubmitting) {
      return;
    }

    const imageList = this.data.imageList as PublishImageItem[];
    if (imageList.some((item) => item.uploadStatus === "uploading")) {
      wx.showToast({
        title: "图片上传中，请稍候",
        icon: "none",
      });
      return;
    }

    if (imageList.some((item) => item.uploadStatus === "error")) {
      wx.showToast({
        title: "请删除上传失败的图片",
        icon: "none",
      });
      return;
    }

    if (!(this.data.isPublishEnabled as boolean)) {
      wx.showToast({
        title: "请先补全内容",
        icon: "none",
      });
      return;
    }

    const uploadedImages = getUploadedImages(imageList);
    const payload = buildPublishPayload(
      this.data.currentTab as PublishTab,
      this.data.titleInput as string,
      this.data.contentInput as string,
      this.data.fieldValues as FieldValues,
      uploadedImages,
    );

    this.setData({
      isSubmitting: true,
    });

    try {
      await requestWithAuth<PublishResult>({
        method: "POST",
        path: "/posts",
        data: payload,
      });

      wx.showToast({
        title: "发布成功",
        icon: "success",
      });

      this.dismissFieldEditor();
      this.finishImageDrag();
      this.refreshPageData({
        currentTab: this.data.currentTab as PublishTab,
        fieldValues: { ...emptyFieldValues },
        titleInput: "",
        contentInput: "",
        imageList: [],
      });
      const currentTab = this.data.currentTab as PublishTab;
      const isServicePost = currentTab !== "PET_SOCIAL";
      wx.setStorageSync(isServicePost ? SERVICE_FEED_REFRESH_FLAG : HOME_FEED_REFRESH_FLAG, true);

      setTimeout(() => {
        wx.switchTab({
          url: isServicePost ? "/pages/tabbar/service/index" : "/pages/tabbar/home/index",
        });
      }, 300);
    } catch (error) {
      wx.showToast({
        title: error instanceof Error ? error.message : "发布失败",
        icon: "none",
      });
    } finally {
      this.setData({
        isSubmitting: false,
      });
    }
  },

  patchImageItem(imageId: string, patch: Partial<PublishImageItem>) {
    const nextImageList = (this.data.imageList as PublishImageItem[]).map((item) =>
      item.id === imageId ? { ...item, ...patch } : item,
    );

    this.refreshPageData({
      currentTab: this.data.currentTab as PublishTab,
      fieldValues: this.data.fieldValues as FieldValues,
      titleInput: this.data.titleInput as string,
      contentInput: this.data.contentInput as string,
      imageList: nextImageList,
    });
  },

  refreshPageData({
    currentTab,
    fieldValues,
    titleInput,
    contentInput,
    imageList,
  }: {
    currentTab: PublishTab;
    fieldValues: FieldValues;
    titleInput: string;
    contentInput: string;
    imageList: PublishImageItem[];
  }) {
    this.setData({
      currentTab,
      titleInput,
      contentInput,
      fieldValues,
      imageList,
      currentFields: buildFieldViews(currentTab, fieldValues),
      isPublishEnabled: isPublishEnabled(
        currentTab,
        titleInput,
        contentInput,
        fieldValues,
        imageList,
      ),
    });
  },
});
