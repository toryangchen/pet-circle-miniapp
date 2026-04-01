import { loadMyPageData } from '../../utils/api';
import { PROFILE_ACTIONS } from '../../utils/mock';
import { mockProfileState } from '../../utils/mock-api';

Page({
  data: {
    title: '我的',
    nickname: mockProfileState.nickname,
    avatarUrl: mockProfileState.avatarUrl,
    phoneStatus: mockProfileState.phoneStatus,
    phoneMask: mockProfileState.phoneMask,
    stats: mockProfileState.stats,
    actions: PROFILE_ACTIONS,
    isLoading: false,
  },

  async onLoad() {
    this.setData({ isLoading: true });

    try {
      const profile = await loadMyPageData();
      this.setData({
        nickname: profile.nickname,
        avatarUrl: profile.avatarUrl,
        phoneStatus: profile.phoneStatus,
        phoneMask: profile.phoneMask,
        stats: profile.stats,
      });
    } finally {
      this.setData({ isLoading: false });
    }
  },
});
