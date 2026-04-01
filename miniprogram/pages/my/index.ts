import { PROFILE_ACTIONS } from '../../utils/mock';

Page({
  data: {
    title: '我的',
    nickname: '糯米和团子的家',
    phoneStatus: '已绑定手机号',
    phoneMask: '138****2048',
    stats: [
      { label: '收藏', value: '12' },
      { label: '发布', value: '8' },
      { label: '消息', value: '3' },
    ],
    actions: PROFILE_ACTIONS,
  },
});
