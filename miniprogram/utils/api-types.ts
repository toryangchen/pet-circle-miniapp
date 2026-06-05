export type PostType = "PET_SOCIAL" | "SERVICE";
export type PostStatus = "PENDING" | "APPROVED" | "REJECTED" | "OFFLINE" | "COMPLETED";
export type ServiceCategory = "ADOPTION" | "HOME_FEEDING" | "BOARDING" | "OTHER" | "SECOND_HAND";
export type NotificationType =
  | "LIKE_POST"
  | "COMMENT_POST"
  | "REPLY_COMMENT"
  | "CONTACT_REQUEST"
  | "CONTACT_APPROVED";
export type ConversationStatus = "INIT" | "PENDING" | "APPROVED" | "IGNORED";
export type ConversationMessageType = "REQUEST_CONTACT" | "SHARE_WECHAT";
export type MessageSenderType = "USER" | "SYSTEM";
export type PublishDraftType = "PET_SOCIAL" | "SERVICE" | "RESALE";

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export interface FeedItem {
  id: string;
  type: PostType;
  serviceCategory: ServiceCategory | null;
  title: string;
  summary: string;
  coverImage: string;
  city: string;
  author?: string | null;
  authorAvatarUrl?: string | null;
  badge?: string;
  meta?: string;
  route?: string;
  stats: {
    likeCount: number;
    commentCount: number;
    favoriteCount: number;
  };
  viewerState: {
    favorited: boolean;
  };
  createdAt: string;
}

export interface FeedCardView {
  id: string;
  title: string;
  summary: string;
  image: string;
  badge: string;
  author: string;
  authorAvatarUrl?: string | null;
  meta?: string;
  route: string;
  favoriteCount: number;
  favorited: boolean;
}

export interface PostDetail {
  id: string;
  type: PostType;
  serviceCategory: ServiceCategory | null;
  status: PostStatus;
  title: string;
  content: string;
  city: string;
  images: string[];
  author: {
    id: string;
    nickname: string | null;
    avatarUrl: string | null;
  } | null;
  contact?:
    | {
        visible: boolean;
        wechatId?: string | null;
        phone?: string | null;
        contactName?: string | null;
      }
    | undefined;
  stats: {
    likeCount: number;
    commentCount: number;
    favoriteCount: number;
  };
  viewerState: {
    liked: boolean;
    favorited: boolean;
    phoneAuthorized: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CommentReplyItem {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    nickname: string | null;
    avatarUrl: string | null;
  };
}

export interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    nickname: string | null;
    avatarUrl: string | null;
  };
  replies: CommentReplyItem[];
}

export interface CommentListResult {
  items: CommentItem[];
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  actor: {
    id: string;
    nickname: string | null;
    avatarUrl: string | null;
  } | null;
  post: {
    id: string;
    type: PostType;
    serviceCategory: ServiceCategory | null;
    title: string;
    city: string;
  } | null;
  conversationId: string | null;
  summary: string;
}

export type NotificationListResult = PagedResult<NotificationItem> & {
  unreadCount: number;
};

export interface NotificationCardView {
  id: string;
  type: NotificationType;
  title: string;
  summary: string;
  time: string;
  unread: boolean;
  route: string;
  conversationId: string | null;
}

export interface MiniappUserSummary {
  id: string;
  nickname: string | null;
  avatarUrl: string | null;
  bgType: string;
  gender: string | null;
  birthday: string | null;
  region: {
    province: string | null;
    city: string | null;
    district: string | null;
  };
  phoneAuthorized: boolean;
  profileAuthorized: boolean;
  phoneMasked?: string;
}

export interface UpdateMyProfilePayload {
  nickname?: string;
  avatarUrl?: string;
  bgType?: string;
  profileAuthorized?: boolean;
  gender?: string;
  birthday?: string;
  regionProvince?: string;
  regionCity?: string;
  regionDistrict?: string;
}

export interface MyPostCardView {
  id: string;
  type: PostType;
  serviceCategory: ServiceCategory | null;
  title: string;
  status: PostStatus;
  summary: string;
  coverImage: string | null;
  city: string;
  author?: string | null;
  authorAvatarUrl?: string | null;
  stats: {
    likeCount: number;
    commentCount: number;
    favoriteCount: number;
  };
  viewerState: {
    favorited: boolean;
  };
  rejectReason?: string | null;
  createdAt: string;
  updatedAt: string;
  route: string;
}

export interface ProfileSummary {
  nickname: string;
  avatarUrl: string | null;
  phoneStatus: string;
  phoneMask: string;
  stats: Array<{ label: string; value: string }>;
  favorites: FeedCardView[];
  posts: MyPostCardView[];
}

export interface PublishTypeItem {
  key: PublishDraftType;
  title: string;
  description: string;
  chip: string;
}

export interface PublishDraft {
  type: PublishDraftType;
  title: string;
  city: string;
  description: string;
  routeHint: string;
}

export interface PublishResult {
  id: string;
  status: PostStatus;
}

export interface ContactRequestResult {
  conversationId: string;
  status: ConversationStatus;
}

export interface ConversationMessage {
  senderType: MessageSenderType;
  messageType: ConversationMessageType;
  content: string;
  createdAt: string;
}

export interface ConversationDetail {
  id: string;
  status: ConversationStatus;
  canApprove: boolean;
  post: {
    id: string;
    type: PostType;
    serviceCategory: ServiceCategory | null;
    title: string;
    city: string;
  } | null;
  messages: ConversationMessage[];
}

export interface ToggleLikeResult {
  id: string;
  liked: boolean;
}

export interface ToggleFavoriteResult {
  id: string;
  favorited: boolean;
}

export interface CommentCreateResult {
  id: string;
}
