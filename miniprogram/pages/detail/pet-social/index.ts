import { loadPostDetail } from '../../../utils/api';

Page({
  data: {
    title: '详情',
    authorName: '雪球',
    postId: 'home-1',
    badge: '宠物圈',
    postTitle: '猫咪春天第一次出门晒太阳',
    summary:
      '今天带家里猫咪出去晒太阳，真的很乖。社区里的宠物日常、救助故事和成长瞬间都放在这里。',
    image:
      'https://images.unsplash.com/photo-1571566882372-1598d88abd90?auto=format&fit=crop&w=1080&q=80',
    stats: [
      { value: '128', label: '点赞' },
      { value: '36', label: '评论' },
      { value: '12', label: '收藏' },
    ],
    tags: ['晒日常', '领养故事', '城市宠物'],
    actions: ['点赞', '评论', '收藏', '分享'],
    isLoading: false,
  },

  async onLoad(query: Record<string, string | undefined>) {
    const postId = query.id || 'home-1';
    this.setData({
      postId,
      isLoading: true,
    });

    try {
      const detail = await loadPostDetail(postId, 'PET_SOCIAL');
      this.setData({
        authorName: detail.author?.nickname || '宠友分享',
        badge: '宠物圈',
        postTitle: detail.title,
        summary: detail.content,
        image: detail.images[0] || this.data.image,
        stats: [
          { value: String(detail.stats.likeCount), label: '点赞' },
          { value: String(detail.stats.commentCount), label: '评论' },
          { value: String(detail.stats.favoriteCount), label: '收藏' },
        ],
        actions: [
          detail.viewerState.liked ? '已点赞' : '点赞',
          '评论',
          detail.viewerState.favorited ? '已收藏' : '收藏',
          '分享',
        ],
      });
    } finally {
      this.setData({
        isLoading: false,
      });
    }
  },

  goBack() {
    wx.navigateBack({
      delta: 1,
    });
  },
});
