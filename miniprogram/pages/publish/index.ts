import type { PublishResult } from "@utils/api-types";
import { requestWithAuth } from "@utils/request";
import { getAuthState } from "@utils/session";
import { uploadImageToCos } from "@utils/cos-upload";
import { resolveUploadableFilePath, rpx2px } from "@utils/util";

type PublishTab = "PET_SOCIAL" | "FOSTER" | "HOME_VISIT" | "RESALE";
type StructuredPublishTab = Exclude<PublishTab, "PET_SOCIAL">;
type FieldInputType = "text" | "textarea" | "picker";
type UploadStatus = "uploading" | "success" | "error";
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
  optionIndex: number;
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
const IMAGE_CARD_RPX = 148;
const IMAGE_SOURCE_OPTIONS = ["从相册选择", "拍照"] as const;

let imageIdSeed = 0;

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

function buildFieldViews(currentTab: PublishTab, values: FieldValues) {
  if (currentTab === "PET_SOCIAL") {
    return [] as FieldView[];
  }

  return fieldGroups[currentTab].map((field) => ({
    ...field,
    value: values[field.key],
    optionIndex: Math.max((field.options ?? []).indexOf(values[field.key]), 0),
  }));
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

  return fieldGroups[currentTab].every((field) => values[field.key].trim());
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
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) {
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

  if (currentTab === "FOSTER") {
    return {
      type: "SERVICE",
      serviceCategory: "BOARDING",
      title: titleInput.trim(),
      content: `${contentInput.trim()}\n是否可上门：${fieldValues.fosterPickup}`.trim(),
      city,
      images,
      boardingDetail: {
        boardingEnvironment: fieldValues.fosterNeed,
        acceptedPetTypes: [fieldValues.fosterPetType],
        price: fieldValues.fosterBudget,
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
    content: `${contentInput.trim()}\n交易方式：${fieldValues.resaleDelivery}`.trim(),
    city,
    images,
    secondHandDetail: {
      itemType: fieldValues.resaleItem,
      itemCondition: fieldValues.resaleCondition,
      price: fieldValues.resalePrice,
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
    dialogFieldKey: "",
    dialogFieldLabel: "",
    dialogFieldValue: "",
    dialogFieldPlaceholder: "",
    dialogFieldInputType: "text" as FieldInputType,
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
        sizeType: ["original"],
      });

      const tempFiles = result.tempFiles
        .map((file) => file.tempFilePath)
        .filter((filePath): filePath is string => Boolean(filePath));

      if (!tempFiles.length) {
        return;
      }

      const nextItems = tempFiles.map((filePath) => createImageItem(filePath));
      const nextImageList = [...imageList, ...nextItems];

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

    const nextImageList = (this.data.imageList as PublishImageItem[]).filter((item) => item.id !== imageId);
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

    const stride = rpx2px(IMAGE_CARD_RPX + IMAGE_GAP_RPX);
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
      dialogFieldKey: field.key,
      dialogFieldLabel: field.label,
      dialogFieldValue: fieldValues[field.key],
      dialogFieldPlaceholder: field.placeholder,
      dialogFieldInputType: field.inputType,
    });
  },

  handleDialogFieldInput(event: WechatMiniprogram.CustomEvent<{ value?: string }>) {
    this.setData({
      dialogFieldValue: event.detail.value ?? "",
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

  closeFieldDialog() {
    this.setData({
      isFieldDialogVisible: false,
      dialogFieldKey: "",
      dialogFieldLabel: "",
      dialogFieldValue: "",
      dialogFieldPlaceholder: "",
      dialogFieldInputType: "text",
    });
  },

  confirmFieldDialog() {
    const dialogFieldKey = this.data.dialogFieldKey as PublishFieldKey | "";
    if (!dialogFieldKey) {
      return;
    }

    const nextValues = {
      ...(this.data.fieldValues as FieldValues),
      [dialogFieldKey]: this.data.dialogFieldValue as string,
    };

    this.refreshPageData({
      currentTab: this.data.currentTab as PublishTab,
      fieldValues: nextValues,
      titleInput: this.data.titleInput as string,
      contentInput: this.data.contentInput as string,
      imageList: this.data.imageList as PublishImageItem[],
    });
    this.closeFieldDialog();
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
        title: "已进入审核队列",
        icon: "success",
      });

      this.closeFieldDialog();
      this.finishImageDrag();
      this.refreshPageData({
        currentTab: this.data.currentTab as PublishTab,
        fieldValues: { ...emptyFieldValues },
        titleInput: "",
        contentInput: "",
        imageList: [],
      });
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
      isPublishEnabled: isPublishEnabled(currentTab, titleInput, contentInput, fieldValues, imageList),
    });
  },
});
