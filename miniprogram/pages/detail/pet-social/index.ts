import {
  createComment,
  loadComments,
  loadPostDetail,
  replyComment,
  togglePostFavorite,
  togglePostLike,
} from '../../../utils/api';
import type { CommentItem } from '../../../utils/api-types';

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
    comments: [] as CommentItem[],
    commentInput: '',
    commentPlaceholder: '说点什么，让宠友看到你的想法',
    replyTargetId: '',
    replyTargetAuthor: '',
    liked: false,
    favorited: true,
    isLoading: false,
    isSubmittingComment: false,
  },

  async onLoad(query: Record<string, string | undefined>) {
    const postId = query.id || 'home-1';
    this.setData({
      postId,
      isLoading: true,
    });

    try {
      const [detail, comments] = await Promise.all([
        loadPostDetail(postId, 'PET_SOCIAL'),
        loadComments(postId),
      ]);
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
        comments: comments.items,
        liked: detail.viewerState.liked,
        favorited: detail.viewerState.favorited,
        actions: this.buildActions(detail.viewerState.liked, detail.viewerState.favorited),
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
      commentPlaceholder: '说点什么，让宠友看到你的想法',
    });
  },

  async toggleLike() {
    const postId = this.data.postId as string;
    const nextLiked = !this.data.liked;
    await togglePostLike(postId, nextLiked);
    this.setData({
      liked: nextLiked,
      actions: this.buildActions(nextLiked, this.data.favorited),
      stats: this.updateStatsValue('点赞', nextLiked ? 1 : -1),
    });
  },

  async toggleFavorite() {
    const postId = this.data.postId as string;
    const nextFavorited = !this.data.favorited;
    await togglePostFavorite(postId, nextFavorited);
    this.setData({
      favorited: nextFavorited,
      actions: this.buildActions(this.data.liked, nextFavorited),
      stats: this.updateStatsValue('收藏', nextFavorited ? 1 : -1),
    });
  },

  focusCommentInput() {
    wx.pageScrollTo({
      scrollTop: 9999,
      duration: 200,
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
        commentPlaceholder: '说点什么，让宠友看到你的想法',
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

  buildActions(liked: boolean, favorited: boolean) {
    return [liked ? '已点赞' : '点赞', '评论', favorited ? '已收藏' : '收藏', '分享'];
  },

  updateStatsValue(label: string, delta: number) {
    return (this.data.stats as Array<{ value: string; label: string }>).map((item) => {
      if (item.label !== label) {
        return item;
      }

      const nextValue = Math.max(0, Number(item.value) + delta);
      return {
        ...item,
        value: String(nextValue),
      };
    });
  },
});
