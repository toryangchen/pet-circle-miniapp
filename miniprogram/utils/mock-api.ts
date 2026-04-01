import {
  HOME_FEEDS,
  HOME_TAGS,
  NOTIFICATION_CARDS,
  PUBLISH_TYPES,
  SERVICE_FEEDS,
  SERVICE_TAGS,
} from './mock';
import type {
  CommentCreateResult,
  CommentItem,
  FeedCardView,
  FeedItem,
  MyPostCardView,
  NotificationCardView,
  NotificationItem,
  PostDetail,
  ProfileSummary,
  PublishTypeItem,
} from './api-types';

const fallbackImage =
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80';

const feedLookup = new Map<string, FeedCardView>([
  ...HOME_FEEDS.map((item) => [
    item.id,
    {
      id: item.id,
      title: item.title,
      summary: item.summary,
      image: item.image,
      badge: item.badge,
      author: item.author,
      meta: item.meta,
      route: `/pages/detail/pet-social/index?id=${item.id}`,
    },
  ] as const),
  ...SERVICE_FEEDS.map((item) => [
    item.id,
    {
      id: item.id,
      title: item.title,
      summary: item.summary,
      image: item.image,
      badge: item.badge,
      author: item.author,
      meta: item.meta,
      route: `/pages/detail/service/index?id=${item.id}`,
    },
  ] as const),
]);

const postDetails: Record<string, PostDetail> = {
  'home-1': {
    id: 'home-1',
    type: 'PET_SOCIAL',
    serviceCategory: null,
    status: 'APPROVED',
    title: HOME_FEEDS[0].title,
    content:
      '今天带家里猫咪出去晒太阳，真的很乖。社区里的宠物日常、救助故事和成长瞬间都放在这里。',
    city: '西安',
    images: [HOME_FEEDS[0].image, HOME_FEEDS[1].image, HOME_FEEDS[2].image],
    author: {
      id: 'author-home-1',
      nickname: HOME_FEEDS[0].author,
      avatarUrl: null,
    },
    stats: {
      likeCount: 128,
      commentCount: 36,
      favoriteCount: 12,
    },
    viewerState: {
      liked: false,
      favorited: true,
      phoneAuthorized: false,
    },
    createdAt: '2026-04-01T08:00:00.000Z',
    updatedAt: '2026-04-01T08:05:00.000Z',
  },
  'home-2': {
    id: 'home-2',
    type: 'PET_SOCIAL',
    serviceCategory: null,
    status: 'APPROVED',
    title: HOME_FEEDS[1].title,
    content: HOME_FEEDS[1].summary,
    city: '西安',
    images: [HOME_FEEDS[1].image],
    author: {
      id: 'author-home-2',
      nickname: HOME_FEEDS[1].author,
      avatarUrl: null,
    },
    stats: {
      likeCount: 56,
      commentCount: 12,
      favoriteCount: 4,
    },
    viewerState: {
      liked: true,
      favorited: false,
      phoneAuthorized: false,
    },
    createdAt: '2026-04-01T08:30:00.000Z',
    updatedAt: '2026-04-01T08:40:00.000Z',
  },
  'service-1': {
    id: 'service-1',
    type: 'SERVICE',
    serviceCategory: 'HOME_FEEDING',
    status: 'APPROVED',
    title: SERVICE_FEEDS[0].title,
    content: '上门喂食、换水、清理猫砂，工作日晚间和周末都可约。',
    city: '西安',
    images: [SERVICE_FEEDS[0].image, fallbackImage],
    author: {
      id: 'author-service-1',
      nickname: SERVICE_FEEDS[0].author,
      avatarUrl: null,
    },
    contact: {
      visible: false,
    },
    stats: {
      likeCount: 24,
      commentCount: 8,
      favoriteCount: 6,
    },
    viewerState: {
      liked: false,
      favorited: false,
      phoneAuthorized: true,
    },
    createdAt: '2026-04-01T09:00:00.000Z',
    updatedAt: '2026-04-01T09:05:00.000Z',
  },
  'service-2': {
    id: 'service-2',
    type: 'SERVICE',
    serviceCategory: 'BOARDING',
    status: 'APPROVED',
    title: SERVICE_FEEDS[1].title,
    content: SERVICE_FEEDS[1].summary,
    city: '西安',
    images: [SERVICE_FEEDS[1].image],
    author: {
      id: 'author-service-2',
      nickname: SERVICE_FEEDS[1].author,
      avatarUrl: null,
    },
    contact: {
      visible: false,
    },
    stats: {
      likeCount: 18,
      commentCount: 6,
      favoriteCount: 4,
    },
    viewerState: {
      liked: false,
      favorited: true,
      phoneAuthorized: true,
    },
    createdAt: '2026-04-01T09:10:00.000Z',
    updatedAt: '2026-04-01T09:18:00.000Z',
  },
};

const favorites: FeedCardView[] = [
  {
    id: 'fav-1',
    title: SERVICE_FEEDS[0].title,
    summary: SERVICE_FEEDS[0].summary,
    image: SERVICE_FEEDS[0].image,
    badge: SERVICE_FEEDS[0].badge,
    author: SERVICE_FEEDS[0].author,
    meta: '已收藏 · 联系受控展示',
    route: '/pages/detail/service/index?id=service-1',
  },
  {
    id: 'fav-2',
    title: HOME_FEEDS[0].title,
    summary: HOME_FEEDS[0].summary,
    image: HOME_FEEDS[0].image,
    badge: HOME_FEEDS[0].badge,
    author: HOME_FEEDS[0].author,
    meta: '已收藏 · 36 评论',
    route: '/pages/detail/pet-social/index?id=home-1',
  },
];

const posts: MyPostCardView[] = [
  {
    id: 'post-1',
    type: 'SERVICE' as const,
    serviceCategory: 'HOME_FEEDING' as const,
    title: '未央区可上门喂养，拍照反馈很及时',
    status: 'PENDING',
    summary: '等待审核中，结构化服务字段已填写。',
    route: '/pages/detail/service/index?id=service-1',
  },
  {
    id: 'post-2',
    type: 'PET_SOCIAL' as const,
    serviceCategory: null,
    title: '猫咪春天第一次出门晒太阳',
    status: 'APPROVED',
    summary: '已审核通过，正在展示。',
    route: '/pages/detail/pet-social/index?id=home-1',
  },
];

const commentLookup: Record<string, CommentItem[]> = {
  'home-1': [
    {
      id: 'comment-home-1',
      content: '太治愈了，晒太阳的小表情真的好可爱。',
      createdAt: '2026-04-01T10:20:00.000Z',
      author: {
        id: 'comment-user-1',
        nickname: '团子的小邻居',
        avatarUrl: null,
      },
      replies: [
        {
          id: 'comment-home-1-reply-1',
          content: '它当天回家睡了一下午，超级满足。',
          createdAt: '2026-04-01T10:40:00.000Z',
          author: {
            id: 'author-home-1',
            nickname: '雪球',
            avatarUrl: null,
          },
        },
      ],
    },
    {
      id: 'comment-home-2',
      content: '这种社区内容就很适合一期，轻松又真实。',
      createdAt: '2026-04-01T11:10:00.000Z',
      author: {
        id: 'comment-user-2',
        nickname: '橘猫罐头',
        avatarUrl: null,
      },
      replies: [],
    },
  ],
  'service-1': [
    {
      id: 'comment-service-1',
      content: '节假日也能约吗？我家两只猫需要每天上门一次。',
      createdAt: '2026-04-01T09:35:00.000Z',
      author: {
        id: 'comment-user-3',
        nickname: '两只布偶的铲屎官',
        avatarUrl: null,
      },
      replies: [
        {
          id: 'comment-service-1-reply-1',
          content: '可以，五一这几天我都在西安。',
          createdAt: '2026-04-01T09:50:00.000Z',
          author: {
            id: 'author-service-1',
            nickname: '喵咪照护站',
            avatarUrl: null,
          },
        },
      ],
    },
  ],
};

function toDetailRoute(item: { id: string; type: FeedItem['type'] }) {
  return item.type === 'SERVICE'
    ? `/pages/detail/service/index?id=${item.id}`
    : `/pages/detail/pet-social/index?id=${item.id}`;
}

function toFeedCardView(item: FeedItem): FeedCardView {
  const fallback = feedLookup.get(item.id);
  const badge = item.type === 'SERVICE'
    ? item.serviceCategory === 'BOARDING'
      ? '宠物寄养'
      : item.serviceCategory === 'ADOPTION'
        ? '领养'
        : item.serviceCategory === 'SECOND_HAND'
          ? '闲置'
          : '上门喂养'
    : '宠物圈';

  return {
    id: item.id,
    title: item.title,
    summary: item.summary,
    image: item.coverImage,
    badge: fallback?.badge ?? badge,
    author: fallback?.author ?? (item.type === 'SERVICE' ? '服务发布' : '宠友分享'),
    meta:
      fallback?.meta ??
      (item.type === 'SERVICE'
        ? `${item.city} · ${item.stats.likeCount} 赞`
        : `${item.city} · ${item.stats.commentCount} 评论`),
    route: fallback?.route ?? toDetailRoute(item),
  };
}

function toNotificationCardView(item: NotificationItem): NotificationCardView {
  const titleMap: Record<NotificationItem['type'], string> = {
    LIKE_POST: '新增点赞',
    COMMENT_POST: '新评论',
    REPLY_COMMENT: '评论回复',
    CONTACT_REQUEST: '收到联系申请',
    CONTACT_APPROVED: '联系申请通过',
  };

  return {
    id: item.id,
    type: item.type,
    title: titleMap[item.type],
    summary: item.summary,
    time: formatRelativeTime(item.createdAt),
    unread: !item.isRead,
    route: item.post
      ? item.post.type === 'SERVICE'
        ? `/pages/detail/service/index?id=${item.post.id}`
        : `/pages/detail/pet-social/index?id=${item.post.id}`
      : '/pages/message/index',
    conversationId: item.conversationId,
  };
}

function formatRelativeTime(isoString: string) {
  const diff = Date.now() - new Date(isoString).getTime();
  if (!Number.isFinite(diff) || diff <= 0) {
    return '刚刚';
  }

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return '刚刚';
  if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))}分钟前`;
  if (diff < day) return `${Math.max(1, Math.floor(diff / hour))}小时前`;
  return `${Math.max(1, Math.floor(diff / day))}天前`;
}

export const mockPublishTypes: PublishTypeItem[] = PUBLISH_TYPES;

export const mockHomeState = {
  location: '西安',
  title: '宠友圈',
  heroTitle: '今天值得被分享的宠物日常',
  heroSummary:
    '用更轻盈的浏览体验看见小猫小狗、领养故事和城市里的温柔瞬间。',
  tags: HOME_TAGS,
  featuredPosts: HOME_FEEDS.map((item) => toFeedCardView({
    id: item.id,
    type: 'PET_SOCIAL',
    serviceCategory: null,
    title: item.title,
    summary: item.summary,
    coverImage: item.image,
    city: '西安',
    author: item.author,
    badge: item.badge,
    meta: item.meta,
    stats: {
      likeCount: 0,
      commentCount: 0,
      favoriteCount: 0,
    },
    createdAt: new Date().toISOString(),
  })),
};

export const mockServiceState = {
  location: '西安',
  title: '服务',
  highlightTitle: '在西安找到更靠谱的宠物帮助',
  highlightSummary:
    '寄养、领养、上门喂养和闲置发布都用更清晰的卡片结构呈现。',
  tags: SERVICE_TAGS,
  tabs: ['全部', '领养', '寄养', '喂养', '闲置'],
  servicePosts: SERVICE_FEEDS.map((item) =>
    toFeedCardView({
      id: item.id,
      type: 'SERVICE',
      serviceCategory: item.id === 'service-2' ? 'BOARDING' : 'HOME_FEEDING',
      title: item.title,
      summary: item.summary,
      coverImage: item.image,
      city: '西安',
      author: item.author,
      badge: item.badge,
      meta: item.meta,
      stats: {
        likeCount: 0,
        commentCount: 0,
        favoriteCount: 0,
      },
      createdAt: new Date().toISOString(),
    }),
  ),
};

export const mockMessageState = {
  title: '消息',
  unreadCount: 2,
  notifications: NOTIFICATION_CARDS.map((item, index) =>
    toNotificationCardView({
      id: item.id,
      type: item.type as NotificationItem['type'],
      isRead: !item.unread,
      createdAt: `2026-04-01T0${index}:10:00.000Z`,
      actor: {
        id: `actor-${index + 1}`,
        nickname: item.title,
        avatarUrl: null,
      },
      post: {
        id: `post-${index + 1}`,
        type: index === 0 ? 'SERVICE' : 'PET_SOCIAL',
        serviceCategory: index === 0 ? 'HOME_FEEDING' : null,
        title: item.title,
        city: '西安',
      },
      conversationId: index === 0 ? 'conversation-1' : null,
      summary: item.summary,
    }),
  ),
};

export const mockProfileState: ProfileSummary = {
  nickname: '糯米和团子的家',
  avatarUrl: null,
  phoneStatus: '已绑定手机号',
  phoneMask: '138****2048',
  stats: [
    { label: '收藏', value: '12' },
    { label: '发布', value: '8' },
    { label: '消息', value: '3' },
  ],
  favorites,
  posts,
};

export function getMockPostDetail(
  postId?: string,
  fallbackType: PostDetail['type'] = 'PET_SOCIAL',
) {
  if (postId && postDetails[postId]) {
    return postDetails[postId];
  }

  return fallbackType === 'SERVICE' ? postDetails['service-1'] : postDetails['home-1'];
}

export function getMockComments(postId: string) {
  return {
    items: [...(commentLookup[postId] ?? [])],
  };
}

export function appendMockComment(postId: string, content: string): CommentCreateResult {
  const createdAt = new Date().toISOString();
  const nextComment: CommentItem = {
    id: `mock-comment-${Date.now()}`,
    content,
    createdAt,
    author: {
      id: 'mock-user-1',
      nickname: '糯米和团子的家',
      avatarUrl: null,
    },
    replies: [],
  };

  const list = commentLookup[postId] ?? [];
  list.push(nextComment);
  commentLookup[postId] = list;

  const detail = postDetails[postId];
  if (detail) {
    detail.stats.commentCount += 1;
    detail.updatedAt = createdAt;
  }

  return {
    id: nextComment.id,
  };
}

export function appendMockReply(commentId: string, content: string): CommentCreateResult {
  const createdAt = new Date().toISOString();

  for (const [postId, list] of Object.entries(commentLookup)) {
    const targetComment = list.find((item) => item.id === commentId);
    if (!targetComment) {
      continue;
    }

    const nextReply = {
      id: `mock-reply-${Date.now()}`,
      content,
      createdAt,
      author: {
        id: 'mock-user-1',
        nickname: '糯米和团子的家',
        avatarUrl: null,
      },
    };

    targetComment.replies.push(nextReply);

    const detail = postDetails[postId];
    if (detail) {
      detail.stats.commentCount += 1;
      detail.updatedAt = createdAt;
    }

    return {
      id: nextReply.id,
    };
  }

  return {
    id: `mock-reply-${Date.now()}`,
  };
}

export function toggleMockLike(postId: string, liked: boolean) {
  const detail = postDetails[postId];
  if (!detail) {
    return {
      id: postId,
      liked,
    };
  }

  const previous = detail.viewerState.liked;
  if (previous !== liked) {
    detail.stats.likeCount += liked ? 1 : -1;
    detail.viewerState.liked = liked;
    detail.updatedAt = new Date().toISOString();
  }

  return {
    id: postId,
    liked: detail.viewerState.liked,
  };
}

export function toggleMockFavorite(postId: string, favorited: boolean) {
  const detail = postDetails[postId];
  if (!detail) {
    return {
      id: postId,
      favorited,
    };
  }

  const previous = detail.viewerState.favorited;
  if (previous !== favorited) {
    detail.stats.favoriteCount += favorited ? 1 : -1;
    detail.viewerState.favorited = favorited;
    detail.updatedAt = new Date().toISOString();
  }

  return {
    id: postId,
    favorited: detail.viewerState.favorited,
  };
}

export function getMockFeed(channel: PostDetail['type']) {
  return channel === 'SERVICE' ? mockServiceState.servicePosts : mockHomeState.featuredPosts;
}

export function getMockNotifications() {
  return mockMessageState.notifications;
}

export function getMockFavorites() {
  return favorites;
}

export function getMockMyPosts() {
  return posts;
}

export function getMockProfile() {
  return mockProfileState;
}

export function getMockFeedCard(id: string) {
  return feedLookup.get(id);
}
