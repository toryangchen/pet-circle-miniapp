import type { CommentCreateResult } from "@utils/api-types";
import { appendMockComment, appendMockReply } from "@utils/mock-api";
import { request } from "@utils/request";

async function withFallback<T>(loader: () => Promise<T>, fallback: T | (() => T)) {
  try {
    return await loader();
  } catch {
    return typeof fallback === "function" ? (fallback as () => T)() : fallback;
  }
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

async function createReplyComment(replyTargetId: string, content: string) {
  return withFallback(
    () =>
      request<CommentCreateResult>({
        method: "POST",
        path: `/comments/${replyTargetId}/replies`,
        data: {
          content,
        },
      }),
    () => appendMockReply(replyTargetId, content),
  );
}

function navigateBackAfterKeyboardHidden(shouldWait: boolean) {
  if (shouldWait) {
    wx.hideKeyboard();
    setTimeout(() => {
      wx.navigateBack({
        delta: 1,
      });
    }, 120);
    return;
  }

  wx.navigateBack({
    delta: 1,
  });
}

Page({
  data: {
    postId: "",
    commentInput: "",
    canSubmit: false,
    isSubmitting: false,
    keyboardHeight: 0,
    inputFocused: true,
    replyTargetId: "",
    replyTargetAuthor: "",
    placeholder: "说点什么...",
  },

  onLoad(query: Record<string, string | undefined>) {
    const replyTargetAuthor = query.replyTargetAuthor
      ? decodeURIComponent(query.replyTargetAuthor)
      : "";
    this.setData({
      postId: query.postId || "",
      replyTargetId: query.replyTargetId || "",
      replyTargetAuthor,
      placeholder: replyTargetAuthor ? `回复 ${replyTargetAuthor}` : "说点什么...",
    });
  },

  onCommentInput(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    const value = event.detail.value;
    const canSubmit = Boolean(value.trim());
    this.setData({
      commentInput: value,
      canSubmit,
    });
  },

  onKeyboardHeightChange(event: WechatMiniprogram.CustomEvent<{ height?: number }>) {
    this.setData({
      keyboardHeight: Math.max(0, event.detail.height || 0),
    });
  },

  noop() {},

  dismissCommentRoute() {
    const keyboardVisible = (this.data.keyboardHeight as number) > 0;
    if (keyboardVisible) {
      this.setData({
        keyboardHeight: 0,
        inputFocused: false,
      });
    }

    navigateBackAfterKeyboardHidden(keyboardVisible);
  },

  async submitComment() {
    const postId = this.data.postId as string;
    const replyTargetId = this.data.replyTargetId as string;
    const content = (this.data.commentInput as string).trim();
    if ((!postId && !replyTargetId) || !content || this.data.isSubmitting) {
      return;
    }

    this.setData({
      isSubmitting: true,
      canSubmit: false,
    });

    try {
      if (replyTargetId) {
        await createReplyComment(replyTargetId, content);
      } else {
        await createPostComment(postId, content);
      }
      const pages = getCurrentPages();
      const previousPage = pages[pages.length - 2] as
        | (WechatMiniprogram.Page.Instance<
            WechatMiniprogram.IAnyObject,
            WechatMiniprogram.IAnyObject
          > & {
            refreshCommentsAfterSubmit?: () => Promise<void>;
          })
        | undefined;
      await previousPage?.refreshCommentsAfterSubmit?.();
      navigateBackAfterKeyboardHidden(false);
    } catch (error) {
      wx.showToast({
        title: error instanceof Error ? error.message : "评论发送失败",
        icon: "none",
      });
    } finally {
      const canSubmit = Boolean((this.data.commentInput as string).trim());
      this.setData({
        isSubmitting: false,
        canSubmit,
      });
    }
  },
});
