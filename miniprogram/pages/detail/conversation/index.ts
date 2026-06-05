import type { ConversationDetail, ConversationMessage } from "@utils/api-types";
import { request } from "@utils/request";

type ConversationMessageView = ConversationMessage & {
  time: string;
  isWechatShare: boolean;
  isOutgoing: boolean;
};

function formatMessageTime(createdAt: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return "刚刚";
  }

  const hour = `${date.getHours()}`.padStart(2, "0");
  const minute = `${date.getMinutes()}`.padStart(2, "0");
  return `${hour}:${minute}`;
}

function toMessageView(
  message: ConversationMessage,
  detail: ConversationDetail,
): ConversationMessageView {
  const isRequest = message.messageType === "REQUEST_CONTACT";
  return {
    ...message,
    time: formatMessageTime(message.createdAt),
    isWechatShare: message.messageType === "SHARE_WECHAT",
    isOutgoing: isRequest && !detail.canApprove,
  };
}

function getRequestMessage(postTitle: string) {
  return `我对您发布的《${postTitle}》很感兴趣，请求交换联系方式。`;
}

async function fetchConversation(conversationId: string) {
  return request<ConversationDetail>({
    method: "POST",
    path: `/conversations/${conversationId}`,
  });
}

async function approveConversationRequest(conversationId: string) {
  return request<{ conversationId: string; status: ConversationDetail["status"] }>({
    method: "POST",
    path: `/conversations/${conversationId}/approve`,
  });
}

Page({
  data: {
    title: "联系申请",
    conversationId: "",
    peerName: "宠友",
    status: "",
    statusTip: "",
    bodyTip: "",
    postTitle: "",
    messages: [] as ConversationMessageView[],
    canApprove: false,
    isInitial: false,
    isLoading: false,
    isApproving: false,
    errorText: "",
    bottomHint: "",
    bottomButtonLabel: "",
    bottomButtonMode: "primary",
  },

  onLoad(query: Record<string, string | undefined>) {
    const conversationId = query.id || "";
    const peerName = query.peerName ? decodeURIComponent(query.peerName) : "宠友";
    this.setData({
      conversationId,
      peerName,
    });
    void this.loadConversation();
  },

  goBack() {
    wx.navigateBack({
      delta: 1,
    });
  },

  async loadConversation() {
    const conversationId = this.data.conversationId as string;
    if (!conversationId) {
      this.applyInitialState();
      return;
    }

    this.setData({
      isLoading: true,
      errorText: "",
    });

    try {
      const detail = await fetchConversation(conversationId);
      this.applyConversation(detail);
    } catch (error) {
      this.setData({
        errorText: error instanceof Error ? error.message : "会话加载失败",
      });
      wx.showToast({
        title: "会话加载失败",
        icon: "none",
      });
    } finally {
      this.setData({
        isLoading: false,
      });
    }
  },

  applyInitialState() {
    this.setData({
      status: "INIT",
      statusTip: "",
      bodyTip: "",
      messages: [],
      canApprove: false,
      isInitial: true,
      bottomHint: "申请会自动带上当前帖子标题",
      bottomButtonLabel: "请求加好友",
      bottomButtonMode: "primary",
    });
  },

  applyConversation(detail: ConversationDetail) {
    const postTitle = detail.post?.title || "当前帖子";
    const messages = detail.messages.length
      ? detail.messages
      : [
          {
            senderType: "SYSTEM" as const,
            messageType: "REQUEST_CONTACT" as const,
            content: getRequestMessage(postTitle),
            createdAt: new Date().toISOString(),
          },
        ];
    const approved = detail.status === "APPROVED";
    const publisherPending = detail.canApprove;
    const initiatorPending = detail.status === "PENDING" && !detail.canApprove;

    this.setData({
      status: detail.status,
      statusTip: approved
        ? "发起联系后，对方同意才会交换联系方式"
        : initiatorPending
          ? "申请已发送，等待发布者处理"
          : publisherPending
            ? "对方申请交换联系方式"
            : "",
      bodyTip: publisherPending
        ? "点击同意后，系统会自动把您的微信号发送给对方。"
        : initiatorPending
          ? "发送后不可重复申请，且不支持继续输入新消息。"
          : "",
      postTitle,
      messages: messages.map((message) => toMessageView(message, detail)),
      canApprove: detail.canApprove,
      isInitial: false,
      bottomHint: approved
        ? "联系方式已交换完成，当前会话已结束"
        : publisherPending
          ? "同意后将自动发送您的微信号"
          : initiatorPending
            ? "已发送申请，等待对方同意"
            : "申请会自动带上当前帖子标题",
      bottomButtonLabel: approved
        ? "已交换联系方式"
        : publisherPending
          ? "同意"
          : initiatorPending
            ? "待处理"
            : "请求加好友",
      bottomButtonMode: approved ? "done" : publisherPending ? "primary" : "disabled",
    });
  },

  async approveConversation() {
    const conversationId = this.data.conversationId as string;
    if (!conversationId || this.data.isApproving || !this.data.canApprove) {
      return;
    }

    this.setData({
      isApproving: true,
    });

    try {
      await approveConversationRequest(conversationId);
      const detail = await fetchConversation(conversationId);
      this.applyConversation(detail);
      wx.showToast({
        title: "已同意",
        icon: "success",
      });
    } catch (error) {
      wx.showToast({
        title: error instanceof Error ? error.message : "操作失败",
        icon: "none",
      });
    } finally {
      this.setData({
        isApproving: false,
      });
    }
  },
});
