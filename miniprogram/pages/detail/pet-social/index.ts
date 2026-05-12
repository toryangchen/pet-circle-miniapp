import type {
  CommentCreateResult,
  CommentItem,
  CommentListResult,
  PostDetail,
  ToggleFavoriteResult,
  ToggleLikeResult,
} from "@utils/api-types";
import {
  appendMockComment,
  appendMockReply,
  getMockComments,
  getMockPostDetail,
  removeMockComment,
  toggleMockFavorite,
  toggleMockLike,
} from "@utils/mock-api";
import { consumePetSocialDetailPrefill } from "@utils/detail-prefill";
import { request } from "@utils/request";
import { getAuthState } from "@utils/session";

async function withFallback<T>(loader: () => Promise<T>, fallback: T | (() => T)) {
  try {
    return await loader();
  } catch {
    return typeof fallback === "function" ? (fallback as () => T)() : fallback;
  }
}

async function fetchPetSocialDetail(postId: string) {
  return withFallback(
    () =>
      request<PostDetail>({
        method: "GET",
        path: `/posts/${postId}`,
      }),
    getMockPostDetail(postId, "PET_SOCIAL"),
  );
}

async function fetchComments(postId: string) {
  return withFallback(
    () =>
      request<CommentListResult>({
        method: "GET",
        path: `/posts/${postId}/comments`,
      }),
    getMockComments(postId),
  );
}

async function createPostComment(postId: string, content: string) {
  return withFallback(
    () =>
      request<CommentCreateResult>({
        method: "POST",
        path: `/posts/${postId}/comments`,
        data: {
          content,
        },
      }),
    () => appendMockComment(postId, content),
  );
}

async function createReplyComment(commentId: string, content: string) {
  return withFallback(
    () =>
      request<CommentCreateResult>({
        method: "POST",
        path: `/comments/${commentId}/replies`,
        data: {
          content,
        },
      }),
    () => appendMockReply(commentId, content),
  );
}

async function deletePostComment(commentId: string) {
  return withFallback(
    () =>
      request<{ id: string }>({
        method: "DELETE",
        path: `/comments/${commentId}`,
      }),
    () => removeMockComment(commentId),
  );
}

async function updatePostLike(postId: string, liked: boolean) {
  return withFallback(
    () =>
      request<ToggleLikeResult>({
        method: liked ? "POST" : "DELETE",
        path: `/posts/${postId}/like`,
      }),
    toggleMockLike(postId, liked),
  );
}

async function updatePostFavorite(postId: string, favorited: boolean) {
  return withFallback(
    () =>
      request<ToggleFavoriteResult>({
        method: favorited ? "POST" : "DELETE",
        path: `/posts/${postId}/favorite`,
      }),
    toggleMockFavorite(postId, favorited),
  );
}

function formatPostMeta(createdAt: string, city: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return city ? `刚刚 · ${city}` : "刚刚";
  }

  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return city ? `${month}-${day} · ${city}` : `${month}-${day}`;
}

function restoreEscapedNewlines(content: string) {
  return content.replace(/\\n/g, "\n");
}

function formatCommentTime(createdAt: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return createdAt || "刚刚";
  }

  const now = Date.now();
  const diff = now - date.getTime();
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;

  if (diff >= 0 && diff < hour) {
    return "刚刚";
  }

  if (diff >= hour && diff < day) {
    return `${Math.max(1, Math.floor(diff / hour))}小时前`;
  }

  if (diff >= day && diff < 2 * day) {
    return "昨天";
  }

  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const dateDay = `${date.getDate()}`.padStart(2, "0");
  return `${month}-${dateDay}`;
}

function getCurrentUserId() {
  const authState = getAuthState();
  return authState.user?.id || authState.session?.userId || "";
}

function formatComments(comments: CommentItem[], currentUserId: string) {
  return comments.map((comment) => ({
    ...comment,
    canDelete: Boolean(currentUserId && comment.author.id === currentUserId),
    createdAt: formatCommentTime(comment.createdAt),
    replies: comment.replies.map((reply) => ({
      ...reply,
      canDelete: Boolean(currentUserId && reply.author.id === currentUserId),
      createdAt: formatCommentTime(reply.createdAt),
    })),
  }));
}

Page({
  data: {
    title: "详情",
    authorName: "",
    authorAvator: "",
    postId: "",
    badge: "",
    postTitle: "",
    summary: "",
    image: "",
    images: [] as string[],
    heroCurrent: 0,
    postMeta: "",
    likeCount: "0",
    commentCount: "0",
    favoriteCount: "0",
    stats: [] as Array<{ value: string; label: string }>,
    tags: [] as string[],
    comments: [] as Array<CommentItem & { canDelete: boolean }>,
    currentUserId: "",
    commentInput: "",
    commentInputFocused: false,
    commentAnchor: "",
    commentPlaceholder: "说点什么...",
    replyTargetId: "",
    replyTargetAuthor: "",
    liked: false,
    favorited: false,
    isLoading: false,
    isSubmittingComment: false,
  },

  async onLoad(query: Record<string, string | undefined>) {
    const postId = query.id || "";
    const currentUserId = getCurrentUserId();
    this.setData({
      postId,
      currentUserId,
      isLoading: true,
    });
    this.applyCachedDetailPrefill(postId);

    try {
      const [detail, comments] = await Promise.all([
        fetchPetSocialDetail(postId),
        fetchComments(postId),
      ]);
      this.setData({
        authorName: detail.author?.nickname || "宠友分享",
        authorAvator: detail.author?.avatarUrl || "",
        badge: "宠物圈",
        postTitle: detail.title,
        summary: restoreEscapedNewlines(detail.content),
        image: detail.images[0] || this.data.image,
        images: detail.images,
        heroCurrent: 0,
        postMeta: formatPostMeta(detail.createdAt, detail.city),
        likeCount: String(detail.stats.likeCount),
        commentCount: String(detail.stats.commentCount),
        favoriteCount: String(detail.stats.favoriteCount),
        stats: [
          { value: String(detail.stats.likeCount), label: "点赞" },
          { value: String(detail.stats.commentCount), label: "评论" },
          { value: String(detail.stats.favoriteCount), label: "收藏" },
        ],
        tags: [],
        comments: formatComments(comments.items, currentUserId),
        liked: detail.viewerState.liked,
        favorited: detail.viewerState.favorited,
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

  applyCachedDetailPrefill(postId: string) {
    const prefill = consumePetSocialDetailPrefill(postId);

    if (!prefill) {
      return;
    }

    this.setData({
      authorName: prefill.authorName || "宠友分享",
      authorAvator: prefill.authorAvatarUrl || "",
      postTitle: prefill.title,
      summary: restoreEscapedNewlines(prefill.summary),
      image: prefill.image,
      images: prefill.image ? [prefill.image] : [],
      heroCurrent: 0,
      favoriteCount: String(prefill.favoriteCount),
      favorited: prefill.favorited,
      stats: [
        { value: "0", label: "点赞" },
        { value: "0", label: "评论" },
        { value: String(prefill.favoriteCount), label: "收藏" },
      ],
    });
  },

  onCommentInput(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({
      commentInput: event.detail.value,
    });
  },

  onCommentBlur() {
    this.setData({
      commentInputFocused: false,
    });
  },

  onHeroSwiperChange(event: WechatMiniprogram.SwiperChange) {
    this.setData({
      heroCurrent: event.detail.current,
    });
  },

  previewHeroImage(event: WechatMiniprogram.CustomEvent<{ current?: string }>) {
    const current = event.currentTarget.dataset.current as string | undefined;
    const images = this.data.images as string[];
    if (!current || !images.length) {
      return;
    }

    wx.previewImage({
      current,
      urls: images,
    });
  },

  startReply(
    event: WechatMiniprogram.CustomEvent<{
      commentId?: string;
      author?: string;
    }>,
  ) {
    const { commentId = "", author = "宠友" } = event.currentTarget.dataset;
    if (!commentId) {
      return;
    }

    this.openCommentComposer({
      replyTargetId: commentId,
      replyTargetAuthor: author,
    });
  },

  cancelReply() {
    this.setData({
      replyTargetId: "",
      replyTargetAuthor: "",
      commentPlaceholder: "说点什么...",
    });
  },

  async toggleLike() {
    const postId = this.data.postId as string;
    const nextLiked = !this.data.liked;
    await updatePostLike(postId, nextLiked);
    const stats = this.updateStatsValue("点赞", nextLiked ? 1 : -1);
    this.setData({
      liked: nextLiked,
      stats,
      likeCount: this.findStatsValue(stats, "点赞"),
    });
  },

  async toggleFavorite() {
    const postId = this.data.postId as string;
    const nextFavorited = !this.data.favorited;
    await updatePostFavorite(postId, nextFavorited);
    const stats = this.updateStatsValue("收藏", nextFavorited ? 1 : -1);
    this.setData({
      favorited: nextFavorited,
      stats,
      favoriteCount: this.findStatsValue(stats, "收藏"),
    });
  },

  openCommentComposer(options?: { replyTargetId?: string; replyTargetAuthor?: string }) {
    const postId = this.data.postId as string;
    if (!postId) {
      return;
    }
    const replyTargetId = options?.replyTargetId || "";
    const replyTargetAuthor = options?.replyTargetAuthor || "";
    const query = replyTargetId
      ? `&replyTargetId=${replyTargetId}&replyTargetAuthor=${encodeURIComponent(replyTargetAuthor)}`
      : "";

    (
      wx.navigateTo as (
        options: WechatMiniprogram.NavigateToOption & Record<string, unknown>,
      ) => void
    )({
      url: `/pages/detail/pet-social/comment/index?postId=${postId}${query}`,
      routeType: "wx://bottom-sheet",
      routeConfig: {
        opaque: false,
        barrierDismissible: false,
        barrierColor: "rgba(0, 0, 0, 0.16)",
        transitionDuration: 120,
        reverseTransitionDuration: 120,
      },
      routeOptions: {
        height: 100,
        round: false,
      },
    });
  },

  async refreshCommentsAfterSubmit() {
    const postId = this.data.postId as string;
    if (!postId) {
      return;
    }

    const [detail, comments] = await Promise.all([
      fetchPetSocialDetail(postId),
      fetchComments(postId),
    ]);
    const currentUserId = getCurrentUserId();
    this.setData({
      currentUserId,
      comments: formatComments(comments.items, currentUserId),
      stats: [
        { value: String(detail.stats.likeCount), label: "点赞" },
        { value: String(detail.stats.commentCount), label: "评论" },
        { value: String(detail.stats.favoriteCount), label: "收藏" },
      ],
      likeCount: String(detail.stats.likeCount),
      commentCount: String(detail.stats.commentCount),
      favoriteCount: String(detail.stats.favoriteCount),
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
        await createReplyComment(replyTargetId, content);
      } else {
        await createPostComment(postId, content);
      }

      const [detail, comments] = await Promise.all([
        fetchPetSocialDetail(postId),
        fetchComments(postId),
      ]);
      this.setData({
        commentInput: "",
        commentInputFocused: false,
        replyTargetId: "",
        replyTargetAuthor: "",
        commentPlaceholder: "说点什么...",
        comments: formatComments(comments.items, getCurrentUserId()),
        stats: [
          { value: String(detail.stats.likeCount), label: "点赞" },
          { value: String(detail.stats.commentCount), label: "评论" },
          { value: String(detail.stats.favoriteCount), label: "收藏" },
        ],
        likeCount: String(detail.stats.likeCount),
        commentCount: String(detail.stats.commentCount),
        favoriteCount: String(detail.stats.favoriteCount),
      });
      wx.showToast({
        title: replyTargetId ? "回复已发送" : "评论已发送",
        icon: "success",
      });
    } catch (error) {
      wx.showToast({
        title: error instanceof Error ? error.message : "评论发送失败",
        icon: "none",
      });
    } finally {
      this.setData({
        isSubmittingComment: false,
      });
    }
  },

  async deleteComment(
    event: WechatMiniprogram.CustomEvent<
      WechatMiniprogram.IAnyObject,
      WechatMiniprogram.IAnyObject,
      { commentId?: string }
    >,
  ) {
    const commentId = event.currentTarget.dataset.commentId || "";
    if (!commentId) {
      return;
    }

    const confirmed = await new Promise<boolean>((resolve) => {
      wx.showModal({
        title: "删除评论",
        content: "确定删除这条评论吗？",
        confirmText: "删除",
        confirmColor: "#e5534b",
        success: (result) => {
          resolve(Boolean(result.confirm));
        },
        fail: () => {
          resolve(false);
        },
      });
    });

    if (!confirmed) {
      return;
    }

    try {
      await deletePostComment(commentId);
      await this.refreshCommentsAfterSubmit();
      wx.showToast({
        title: "评论已删除",
        icon: "success",
      });
    } catch (error) {
      wx.showToast({
        title: error instanceof Error ? error.message : "删除失败",
        icon: "none",
      });
    }
  },

  onShareAppMessage() {
    return {
      title: this.data.postTitle as string,
      path: `/pages/detail/pet-social/index?id=${this.data.postId}`,
      imageUrl: this.data.image as string,
    };
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

  findStatsValue(stats: Array<{ value: string; label: string }>, label: string) {
    return stats.find((item) => item.label === label)?.value || "0";
  },
});
