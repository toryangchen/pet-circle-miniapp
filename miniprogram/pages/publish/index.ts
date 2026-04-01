import { PUBLISH_TYPES } from '../../utils/mock';

Page({
  data: {
    title: '发布',
    currentType: 'SERVICE',
    tabs: [
      { key: 'PET_SOCIAL', label: '宠物圈' },
      { key: 'SERVICE', label: '服务' },
      { key: 'RESALE', label: '闲置' },
    ],
    publishTypes: PUBLISH_TYPES,
    fields: [
      { label: '标题', value: '西安高新区可上门喂猫，五一假期可接单' },
      { label: '城市', value: '西安' },
      { label: '联系方式', value: '手机号授权后自动展示联系入口' },
      { label: '描述', value: '家里两只英短，提供上门喂食、换水和简单陪玩。' },
    ],
  },

  switchType(event: WechatMiniprogram.BaseEvent) {
    const { key } = event.currentTarget.dataset as { key?: string };
    if (!key) {
      return;
    }

    this.setData({
      currentType: key,
    });
  },
});
