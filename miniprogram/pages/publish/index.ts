import type { PublishDraftType } from '../../utils/api-types';
import { submitPublishDraft } from '../../utils/api';
import { mockPublishTypes } from '../../utils/mock-api';

type DraftField = {
  label: string;
  value: string;
};

const draftMap: Record<
  PublishDraftType,
  {
    fields: DraftField[];
    description: string;
  }
> = {
  PET_SOCIAL: {
    description: '今天带家里猫咪出去晒太阳，真的很乖，想把这份柔软分享给更多宠友。',
    fields: [
      { label: '标题', value: '猫咪春天第一次出门晒太阳' },
      { label: '城市', value: '西安' },
      { label: '内容', value: '宠物日常、救助故事和社区分享会走宠物圈内容审核。' },
      { label: '图片', value: '默认带 1 张占位封面，后续切真上传。' },
    ],
  },
  SERVICE: {
    description: '家里两只英短，提供上门喂食、换水和简单陪玩。',
    fields: [
      { label: '标题', value: '西安高新区可上门喂猫，五一假期可接单' },
      { label: '城市', value: '西安' },
      { label: '联系方式', value: '手机号授权后自动展示联系入口' },
      { label: '描述', value: '家里两只英短，提供上门喂食、换水和简单陪玩。' },
    ],
  },
  RESALE: {
    description: '家里闲置猫爬架和饮水机，成色很好，支持同城自提。',
    fields: [
      { label: '标题', value: '二手猫爬架和饮水机，同城自提' },
      { label: '城市', value: '西安' },
      { label: '联系方式', value: '受控联系申请后展示' },
      { label: '描述', value: '会以闲置服务类型提交，后续接真实二手字段。' },
    ],
  },
};

Page({
  data: {
    title: '发布',
    currentType: 'SERVICE' as PublishDraftType,
    tabs: [
      { key: 'PET_SOCIAL', label: '宠物圈' },
      { key: 'SERVICE', label: '服务' },
      { key: 'RESALE', label: '闲置' },
    ],
    publishTypes: mockPublishTypes,
    fields: draftMap.SERVICE.fields,
    submitState: '',
    isSubmitting: false,
  },

  switchType(event: WechatMiniprogram.BaseEvent) {
    const { key } = event.currentTarget.dataset as { key?: PublishDraftType };
    if (!key) {
      return;
    }

    this.setData({
      currentType: key,
      fields: draftMap[key].fields,
      submitState: '',
    });
  },

  async submitDraft() {
    if (this.data.isSubmitting) {
      return;
    }

    const currentType = this.data.currentType as PublishDraftType;
    const draft = draftMap[currentType];

    this.setData({
      isSubmitting: true,
      submitState: '正在提交草稿...',
    });

    try {
      const result = await submitPublishDraft({
        type: currentType,
        title: draft.fields[0].value,
        city: draft.fields[1].value,
        description: draft.description,
        routeHint: `/pages/publish/index?type=${currentType}`,
      });

      this.setData({
        submitState: `已提交，当前状态：${result.status}`,
      });

      wx.showToast({
        title: '已进入审核队列',
        icon: 'success',
      });
    } catch {
      this.setData({
        submitState: '提交失败，已保留当前草稿。',
      });

      wx.showToast({
        title: '提交失败',
        icon: 'none',
      });
    } finally {
      this.setData({
        isSubmitting: false,
      });
    }
  },
});
