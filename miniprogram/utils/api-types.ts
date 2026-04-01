export type PostType = 'PET_SOCIAL' | 'SERVICE';
export type PostStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'OFFLINE' | 'COMPLETED';
export type ServiceCategory =
  | 'ADOPTION'
  | 'SECOND_HAND'
  | 'HOME_FEEDING'
  | 'BOARDING';
export type NotificationType =
  | 'LIKE_POST'
  | 'COMMENT_POST'
  | 'REPLY_COMMENT'
  | 'CONTACT_REQUEST'
  | 'CONTACT_APPROVED';
export type ConversationStatus = 'INIT' | 'PENDING' | 'APPROVED' | 'IGNORED';
export type PublishDraftType = 'PET_SOCIAL' | 'SERVICE' | 'RESALE';

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
  author?: string;
  badge?: string;
  meta?: string;
  route?: string;
  stats: {
    likeCount: number;
    commentCount: number;
    favoriteCount: number;
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
  meta: string;
  route: string;
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
  phoneAuthorized: boolean;
  profileAuthorized: boolean;
  phoneMasked?: string;
}

export interface MyPostCardView {
  id: string;
  type: PostType;
  serviceCategory: ServiceCategory | null;
  title: string;
  status: PostStatus;
  summary: string;
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
