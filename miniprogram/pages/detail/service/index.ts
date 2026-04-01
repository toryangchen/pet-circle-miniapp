import {
  createComment,
  loadComments,
  loadPostDetail,
  replyComment,
  requestContactForPost,
  togglePostFavorite,
} from '../../../utils/api';
import type { CommentItem, ServiceCategory } from '../../../utils/api-types';

Page({
  data: {
    title: '详情',
    authorName: '糯米和团子的家',
    postId: 'service-1',
    badge: '上门喂养',
    postTitle: '未央区可上门喂养，拍照反馈很及时',
    summary: '上门喂食、换水、清理猫砂，工作日晚间和周末都可约。',
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1080&q=80',
    stats: [
      { value: '3.8km', label: '距离' },
      { value: '30元起', label: '费用' },
      { value: '服务中', label: '状态' },
    ],
    serviceFields: [
      { label: '服务区域', value: '未央区 / 雁塔区' },
      { label: '可约时间', value: '工作日晚间 / 周末全天' },
      { label: '联系方式', value: '受控联系申请后展示' },
    ],
    contactTitle: '联系发布者',
    contactSummary: '进入受控联系会话后，系统会帮你发送申请和联系方式。',
    contactButtonLabel: '请求加好友',
    comments: [] as CommentItem[],
    commentInput: '',
    commentPlaceholder: '补充需求或公开提问',
    replyTargetId: '',
    replyTargetAuthor: '',
    favorited: false,
    isLoading: false,
    isSubmittingComment: false,
  },

  async onLoad(query: Record<string, string | undefined>) {
    const postId = query.id || 'service-1';
    this.setData({
      postId,
      isLoading: true,
    });

    try {
      const [detail, comments] = await Promise.all([
        loadPostDetail(postId, 'SERVICE'),
        loadComments(postId),
      ]);
      this.setData({
        authorName: detail.author?.nickname || '服务发布',
        badge: this.resolveBadge(detail.serviceCategory),
        postTitle: detail.title,
        summary: detail.content,
        image: detail.images[0] || this.data.image,
        stats: [
          { value: detail.city, label: '城市' },
          { value: `${detail.stats.favoriteCount} 收藏`, label: '收藏' },
          { value: detail.status, label: '状态' },
        ],
        serviceFields: [
          { label: '服务区域', value: detail.city },
          {
            label: '联系方式',
            value: detail.contact?.visible
              ? detail.contact.wechatId || detail.contact.phone || '已授权可见'
              : '受控联系申请后展示',
          },
          {
            label: '联系入口',
            value: detail.viewerState.phoneAuthorized
              ? '可发起联系申请'
              : '需先完成手机号授权',
          },
        ],
        comments: comments.items,
        favorited: detail.viewerState.favorited,
        contactButtonLabel: detail.viewerState.phoneAuthorized
          ? '请求加好友'
          : '先绑定手机号',
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

  async requestContact() {
    const postId = this.data.postId as string;
    const contactButtonLabel = this.data.contactButtonLabel as string;

    if (contactButtonLabel !== '请求加好友') {
      wx.showToast({
        title: '请先完成手机号授权',
        icon: 'none',
      });
      return;
    }

    const result = await requestContactForPost(postId);
    wx.showToast({
      title: `申请已发送：${result.status}`,
      icon: 'success',
    });
  },

  onCommentInput(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({
      commentInput: event.detail.value,
    });
  },

  startReply(event: WechatMiniprogram.CustomEvent<{ commentId?: string; author?: string }>) {
    const { commentId = '', author = '宠友' } = event.currentTarget.dataset;
    if (!commentId) {
      return;
    }

    this.setData({
      replyTargetId: commentId,
      replyTargetAuthor: author,
      commentPlaceholder: `回复 ${author}`,
    });
  },

  cancelReply() {
    this.setData({
      replyTargetId: '',
      replyTargetAuthor: '',
      commentPlaceholder: '补充需求或公开提问',
    });
  },

  async toggleFavorite() {
    const postId = this.data.postId as string;
    const nextFavorited = !this.data.favorited;
    await togglePostFavorite(postId, nextFavorited);
    this.setData({
      favorited: nextFavorited,
      stats: this.updateStatsValue('收藏', nextFavorited ? 1 : -1),
    });
  },

  async submitComment() {
    const postId = this.data.postId as string;
    const content = (this.data.commentInput as string).trim();
    const replyTargetId = this.data.replyTargetId as string;

    if (!content || this.data.isSubmittingComment) {
      return;
    }

    this.setData({
      isSubmittingComment: true,
    });

    try {
      if (replyTargetId) {
        await replyComment(replyTargetId, content);
      } else {
        await createComment(postId, content);
      }

      const comments = await loadComments(postId);
      this.setData({
        comments: comments.items,
        commentInput: '',
        replyTargetId: '',
        replyTargetAuthor: '',
        commentPlaceholder: '补充需求或公开提问',
        stats: this.updateStatsValue('评论', 1),
      });
      wx.showToast({
        title: replyTargetId ? '回复已发送' : '评论已发送',
        icon: 'success',
      });
    } finally {
      this.setData({
        isSubmittingComment: false,
      });
    }
  },

  resolveBadge(serviceCategory: ServiceCategory | null) {
    switch (serviceCategory) {
      case 'BOARDING':
        return '宠物寄养';
      case 'ADOPTION':
        return '领养';
      case 'SECOND_HAND':
        return '闲置';
      default:
        return '上门喂养';
    }
  },

  updateStatsValue(label: string, delta: number) {
    return (this.data.stats as Array<{ value: string; label: string }>).map((item) => {
      if (item.label !== label) {
        return item;
      }

      const numericValue = Number(String(item.value).replace(/[^\d]/g, ''));
      const nextValue = Math.max(0, numericValue + delta);
      return {
        ...item,
        value: label === '收藏' ? `${nextValue} 收藏` : String(nextValue),
      };
    });
  },
});
