import type { CommentCreateResult } from "@utils/api-types";
import { appendMockComment } from "@utils/mock-api";
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
    appendMockComment(postId, content),
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
    isSubmitting: false,
    keyboardHeight: 0,
    inputFocused: true,
  },

  onLoad(query: Record<string, string | undefined>) {
    this.setData({
      postId: query.postId || "",
    });
  },

  onCommentInput(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({
      commentInput: event.detail.value,
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
    const content = (this.data.commentInput as string).trim();
    if (!postId || !content || this.data.isSubmitting) {
      return;
    }

    this.setData({
      isSubmitting: true,
    });

    try {
      await createPostComment(postId, content);
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
      this.setData({
        isSubmitting: false,
      });
    }
  },
});
