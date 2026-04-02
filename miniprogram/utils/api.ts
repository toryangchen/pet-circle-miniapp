import type {
  CommentCreateResult,
  CommentListResult,
  ContactRequestResult,
  FeedCardView,
  FeedItem,
  MyPostCardView,
  NotificationCardView,
  NotificationItem,
  PagedResult,
  PostDetail,
  PostStatus,
  ProfileSummary,
  PublishDraft,
  PublishResult,
  ToggleFavoriteResult,
  ToggleLikeResult,
} from "./api-types";
import {
  appendMockComment,
  appendMockReply,
  getMockComments,
  getMockPostDetail,
  mockHomeState,
  mockServiceState,
  toggleMockFavorite,
  toggleMockLike,
} from "./mock-api";
import {
  bootstrapSession,
  ensureAuthenticated,
  getAuthState,
  getCurrentSession,
  recoverSession,
  syncCurrentUser,
} from "./session";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

interface ApiEnvelope<T> {
  code: number;
  message: string;
  data: T;
}

interface RequestOptions {
  method: HttpMethod;
  path: string;
  data?: WechatMiniprogram.IAnyObject | string | ArrayBuffer;
}

class ApiRequestError extends Error {
  statusCode?: number;

  bodyCode?: number;

  constructor(message: string, options?: { statusCode?: number; bodyCode?: number }) {
    super(message);
    this.name = "ApiRequestError";
    this.statusCode = options?.statusCode;
    this.bodyCode = options?.bodyCode;
  }
}

const DEFAULT_API_BASE_URL = "http://127.0.0.1:3000/api";
const DEFAULT_POST_IMAGE =
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80";

function getApiBaseUrl() {
  return DEFAULT_API_BASE_URL;
}

function isUnauthorizedError(error: unknown) {
  return error instanceof ApiRequestError && error.statusCode === 401;
}

function getAuthHeader(token?: string | null) {
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

function requestRaw<T>(options: RequestOptions, token?: string | null): Promise<T> {
  const url = `${getApiBaseUrl()}${options.path}`;
  const headers = {
    "content-type": "application/json",
    ...getAuthHeader(token),
  };

  return new Promise<T>((resolve, reject) => {
    wx.request({
      url,
      method: options.method as WechatMiniprogram.RequestOption["method"],
      data: options.data,
      header: headers,
      timeout: 3000,
      success: (response) => {
        const body = response.data as ApiEnvelope<T> | undefined;
        if (response.statusCode >= 200 && response.statusCode < 300 && body?.code === 0) {
          resolve(body.data);
          return;
        }

        reject(
          new ApiRequestError(body?.message || `HTTP ${response.statusCode}`, {
            statusCode: response.statusCode,
            bodyCode: body?.code,
          }),
        );
      },
      fail: () => {
        reject(new ApiRequestError("Network request failed."));
      },
    });
  });
}

async function request<T>(options: RequestOptions): Promise<T> {
  const session = getCurrentSession();
  return requestRaw(options, session?.token);
}

async function requestWithAuth<T>(options: RequestOptions): Promise<T> {
  const session = await ensureAuthenticated();

  try {
    return await requestRaw<T>(options, session.token);
  } catch (error) {
    if (!isUnauthorizedError(error)) {
      throw error;
    }

    const recoveredSession = await recoverSession();
    return requestRaw<T>(options, recoveredSession.token);
  }
}

async function withFallback<T>(loader: () => Promise<T>, fallback: T | (() => T)) {
  try {
    return await loader();
  } catch {
    return typeof fallback === "function" ? (fallback as () => T)() : fallback;
  }
}

function buildDetailRoute(item: { id: string; type: FeedItem["type"] }) {
  return item.type === "SERVICE"
    ? `/pages/detail/service/index?id=${item.id}`
    : `/pages/detail/pet-social/index?id=${item.id}`;
}

function resolveFeedBadge(item: FeedItem) {
  if (item.badge) {
    return item.badge;
  }

  if (item.type === "SERVICE") {
    switch (item.serviceCategory) {
      case "BOARDING":
        return "宠物寄养";
      case "ADOPTION":
        return "领养";
      case "SECOND_HAND":
        return "闲置";
      default:
        return "上门喂养";
    }
  }

  return "宠物圈";
}

function resolveFeedAuthor(item: FeedItem) {
  if (item.author) {
    return item.author;
  }

  return item.type === "SERVICE" ? "服务发布" : "宠友分享";
}

function resolveFeedMeta(item: FeedItem) {
  if (item.meta) {
    return item.meta;
  }

  return item.type === "SERVICE"
    ? `${item.city} · ${item.stats.likeCount} 赞`
    : `${item.city} · ${item.stats.commentCount} 评论`;
}

function toFeedCardView(item: FeedItem): FeedCardView {
  return {
    id: item.id,
    title: item.title,
    summary: item.summary,
    image: item.coverImage,
    badge: resolveFeedBadge(item),
    author: resolveFeedAuthor(item),
    meta: resolveFeedMeta(item),
    route: item.route ?? buildDetailRoute(item),
  };
}

function toNotificationCardView(item: NotificationItem): NotificationCardView {
  const titleMap: Record<NotificationItem["type"], string> = {
    LIKE_POST: "新增点赞",
    COMMENT_POST: "新评论",
    REPLY_COMMENT: "评论回复",
    CONTACT_REQUEST: "收到联系申请",
    CONTACT_APPROVED: "联系申请通过",
  };

  return {
    id: item.id,
    type: item.type,
    title: titleMap[item.type],
    summary: item.summary,
    time: formatRelativeTime(item.createdAt),
    unread: !item.isRead,
    route: item.post ? buildDetailRoute(item.post) : "/pages/message/index",
    conversationId: item.conversationId,
  };
}

function toMyPostCardView(item: {
  id: string;
  type: FeedItem["type"];
  serviceCategory: FeedItem["serviceCategory"];
  title: string;
  status: PostStatus;
  city?: string;
  rejectReason?: string | null;
  summary?: string;
  route?: string;
}): MyPostCardView {
  return {
    id: item.id,
    type: item.type,
    serviceCategory: item.serviceCategory,
    title: item.title,
    status: item.status,
    summary:
      item.summary ??
      (item.status === "REJECTED" && item.rejectReason
        ? `审核未通过：${item.rejectReason}`
        : `${item.city ?? "西安"} · ${item.status}`),
    route: item.route ?? buildDetailRoute(item),
  };
}

function formatRelativeTime(isoString: string) {
  const diff = Date.now() - new Date(isoString).getTime();
  if (!Number.isFinite(diff) || diff <= 0) {
    return "刚刚";
  }

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "刚刚";
  if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))}分钟前`;
  if (diff < day) return `${Math.max(1, Math.floor(diff / hour))}小时前`;
  return `${Math.max(1, Math.floor(diff / day))}天前`;
}

function buildPagedFallback<T>(items: T[], page = 1, pageSize = 10): PagedResult<T> {
  return {
    items,
    page,
    pageSize,
    total: items.length,
    hasMore: false,
  };
}

function buildPublishRequest(draft: PublishDraft) {
  if (draft.type === "PET_SOCIAL") {
    return {
      type: "PET_SOCIAL",
      title: draft.title,
      content: draft.description,
      city: draft.city,
      images: [DEFAULT_POST_IMAGE],
    };
  }

  if (draft.type === "RESALE") {
    return {
      type: "SERVICE",
      serviceCategory: "SECOND_HAND",
      title: draft.title,
      content: draft.description,
      city: draft.city,
      images: [DEFAULT_POST_IMAGE],
      contact: {
        wechatId: "mock-wechat",
      },
      secondHandDetail: {
        itemType: "闲置",
        itemCondition: "良好",
        price: "面议",
      },
    };
  }

  return {
    type: "SERVICE",
    serviceCategory: "HOME_FEEDING",
    title: draft.title,
    content: draft.description,
    city: draft.city,
    images: [DEFAULT_POST_IMAGE],
    contact: {
      wechatId: "mock-wechat",
      phone: "13800000000",
    },
    homeFeedingDetail: {
      serviceArea: "西安市区",
      availableTime: "工作日晚间",
      price: "30",
    },
  };
}

export async function loadHomeFeed() {
  return withFallback(async () => {
    const result = await request<PagedResult<FeedItem>>({
      method: "GET",
      path: "/posts/feed?channel=PET_SOCIAL&page=1&pageSize=10",
    });

    return {
      ...result,
      items: result.items.map(toFeedCardView),
    };
  }, buildPagedFallback(mockHomeState.featuredPosts));
}

export async function loadServiceFeed() {
  return withFallback(async () => {
    const result = await request<PagedResult<FeedItem>>({
      method: "GET",
      path: "/posts/feed?channel=SERVICE&page=1&pageSize=10",
    });

    return {
      ...result,
      items: result.items.map(toFeedCardView),
    };
  }, buildPagedFallback(mockServiceState.servicePosts));
}

export async function loadPostDetail(postId: string, channel: "PET_SOCIAL" | "SERVICE") {
  return withFallback(
    () =>
      request<PostDetail>({
        method: "GET",
        path: `/posts/${postId}`,
      }),
    getMockPostDetail(postId, channel),
  );
}

export async function requestContactForPost(postId: string) {
  return requestWithAuth<ContactRequestResult>({
    method: "POST",
    path: `/posts/${postId}/contact-request`,
  });
}

export async function loadComments(postId: string) {
  return withFallback(
    () =>
      request<CommentListResult>({
        method: "GET",
        path: `/posts/${postId}/comments`,
      }),
    getMockComments(postId),
  );
}

export async function createComment(postId: string, content: string) {
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

export async function replyComment(commentId: string, content: string) {
  return withFallback(
    () =>
      request<CommentCreateResult>({
        method: "POST",
        path: `/comments/${commentId}/replies`,
        data: {
          content,
        },
      }),
    appendMockReply(commentId, content),
  );
}

export async function togglePostLike(postId: string, liked: boolean) {
  return withFallback(
    () =>
      request<ToggleLikeResult>({
        method: liked ? "POST" : "DELETE",
        path: `/posts/${postId}/like`,
      }),
    toggleMockLike(postId, liked),
  );
}

export async function togglePostFavorite(postId: string, favorited: boolean) {
  return withFallback(
    () =>
      request<ToggleFavoriteResult>({
        method: favorited ? "POST" : "DELETE",
        path: `/posts/${postId}/favorite`,
      }),
    toggleMockFavorite(postId, favorited),
  );
}

export async function loadNotifications() {
  const result = await requestWithAuth<PagedResult<NotificationItem>>({
    method: "GET",
    path: "/notifications?page=1&pageSize=20",
  });

  return {
    ...result,
    items: result.items.map(toNotificationCardView),
  };
}

export async function markNotificationRead(notificationId: string) {
  return requestWithAuth<{
    id: string;
    isRead: boolean;
  }>({
    method: "POST",
    path: `/notifications/${notificationId}/read`,
  });
}

export async function markAllNotificationsRead() {
  return requestWithAuth<{
    updatedCount: number;
  }>({
    method: "POST",
    path: "/notifications/read-all",
  });
}

export async function loadMe() {
  await bootstrapSession();

  if (!getAuthState().isAuthenticated) {
    return null;
  }

  const syncedUser = await syncCurrentUser();
  return syncedUser ?? getAuthState().user;
}

export async function loadMyFavorites() {
  const result = await requestWithAuth<PagedResult<FeedItem>>({
    method: "GET",
    path: "/favorites/my?page=1&pageSize=20",
  });

  return {
    ...result,
    items: result.items.map(toFeedCardView),
  };
}

export async function loadMyPosts(status?: PostStatus, page = 1, pageSize = 20) {
  const searchParams = [`page=${page}`, `pageSize=${pageSize}`];
  if (status) {
    searchParams.unshift(`status=${status}`);
  }

  const query = `?${searchParams.join("&")}`;
  const result = await requestWithAuth<
    PagedResult<{
      id: string;
      type: FeedItem["type"];
      serviceCategory: FeedItem["serviceCategory"];
      title: string;
      status: PostStatus;
      city?: string;
      rejectReason?: string | null;
      summary?: string;
    }>
  >({
    method: "GET",
    path: `/posts/my${query}`,
  });

  return {
    ...result,
    items: result.items.map((item) => toMyPostCardView(item)),
  };
}

export async function loadMyPageData(): Promise<ProfileSummary> {
  await bootstrapSession();

  if (!getAuthState().isAuthenticated) {
    return {
      nickname: "未登录",
      avatarUrl: null,
      phoneStatus: "登录不可用",
      phoneMask: "可继续浏览公开内容",
      stats: [
        { label: "收藏", value: "0" },
        { label: "发布", value: "0" },
        { label: "消息", value: "0" },
      ],
      favorites: [],
      posts: [],
    };
  }

  const [me, favorites, posts, notifications] = await Promise.all([
    loadMe(),
    loadMyFavorites(),
    loadMyPosts(),
    loadNotifications(),
  ]);

  const unreadCount = notifications.items.filter((item) => item.unread).length;
  const currentUser = me ?? getAuthState().user;

  return {
    nickname: currentUser?.nickname ?? "宠友圈用户",
    avatarUrl: currentUser?.avatarUrl ?? null,
    phoneStatus: currentUser?.phoneAuthorized ? "已绑定手机号" : "未绑定手机号",
    phoneMask: currentUser?.phoneMasked ?? "发布或联系前需先授权",
    stats: [
      { label: "收藏", value: String(favorites.total) },
      { label: "发布", value: String(posts.total) },
      { label: "消息", value: String(unreadCount) },
    ],
    favorites: favorites.items,
    posts: posts.items,
  };
}

export async function submitPublishDraft(draft: PublishDraft): Promise<PublishResult> {
  return requestWithAuth<PublishResult>({
    method: "POST",
    path: "/posts",
    data: buildPublishRequest(draft),
  });
}

export async function offlineMyPost(postId: string) {
  return requestWithAuth<{
    id: string;
    status: PostStatus;
  }>({
    method: "PATCH",
    path: `/posts/${postId}/offline`,
  });
}

export async function completeMyPost(postId: string) {
  return requestWithAuth<{
    id: string;
    status: PostStatus;
  }>({
    method: "PATCH",
    path: `/posts/${postId}/complete`,
  });
}

export { buildPublishRequest };
