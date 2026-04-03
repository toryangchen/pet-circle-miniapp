export type MainTabKey = "home" | "service" | "publish" | "message" | "my";

export type PublishTypeKey = "PET_SOCIAL" | "SERVICE" | "RESALE";
export type NotificationCardType =
  | "LIKE_POST"
  | "COMMENT_POST"
  | "REPLY_COMMENT"
  | "CONTACT_REQUEST"
  | "CONTACT_APPROVED";

export interface MainTabItem {
  key: MainTabKey;
  label: string;
  route: string;
}

export interface FeedCard {
  id: string;
  title: string;
  summary: string;
  image: string;
  badge: string;
  author: string;
  meta: string;
  route: string;
}

export interface NotificationCard {
  id: string;
  type: NotificationCardType;
  title: string;
  summary: string;
  time: string;
  unread: boolean;
}

export interface PublishTypeCard {
  key: PublishTypeKey;
  title: string;
  description: string;
  chip: string;
}

export interface ProfileAction {
  id: string;
  title: string;
  summary: string;
}

export const MAIN_TABS: MainTabItem[] = [
  { key: "home", label: "首页", route: "/pages/index/index" },
  { key: "service", label: "服务", route: "/pages/service/index" },
  { key: "publish", label: "发布", route: "/pages/publish/index" },
  { key: "message", label: "消息", route: "/pages/message/index" },
  { key: "my", label: "我的", route: "/pages/my/index" },
];

export const HOME_FEEDS: FeedCard[] = [
  {
    id: "home-1",
    title: "今天值的宠物日常",
    summary: "用轻松的卡片浏览社区里的日常、故事和城市瞬间。",
    image:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80",
    badge: "宠物圈",
    author: "雪球",
    meta: "2分钟前 · 36 评论",
    route: "/pages/detail/pet-social/index",
  },
  {
    id: "home-2",
    title: "猫咪春天第一次出门晒太阳猫咪春天第一次出门晒太阳",
    summary: "柔软的午后、轻松的散步和刚刚好的阳光。",
    image:
      "https://images.unsplash.com/photo-1571566882372-1598d88abd90?auto=format&fit=crop&w=900&q=80",
    badge: "晒日常",
    author: "团子",
    meta: "15分钟前 · 12 点赞",
    route: "/pages/detail/pet-social/index",
  },
  {
    id: "home-3",
    title: "在城市里认真分享一只小狗的成长",
    summary: "记录、成长、陪伴，是这个首页最温柔的关键词。",
    image:
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80",
    badge: "成长记录",
    author: "糯米",
    meta: "1小时前 · 8 收藏",
    route: "/pages/detail/pet-social/index",
  },
  {
    id: "home-1",
    title: "今天值得被分享的宠物",
    summary: "用轻松的卡片浏览社区里的日常、故事和城市瞬间。",
    image:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80",
    badge: "宠物圈",
    author: "雪球",
    meta: "2分钟前 · 36 评论",
    route: "/pages/detail/pet-social/index",
  },
  {
    id: "home-2",
    title: "猫咪春天第一次出门晒太阳猫咪春天第一次出门晒太阳",
    summary: "柔软的午后、轻松的散步和刚刚好的阳光。",
    image:
      "https://images.unsplash.com/photo-1571566882372-1598d88abd90?auto=format&fit=crop&w=900&q=80",
    badge: "晒日常",
    author: "团子",
    meta: "15分钟前 · 12 点赞",
    route: "/pages/detail/pet-social/index",
  },
  {
    id: "home-3",
    title: "在城市里认真分长",
    summary: "记录、成长、陪伴，是这个首页最温柔的关键词。",
    image:
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80",
    badge: "成长记录",
    author: "糯米",
    meta: "1小时前 · 8 收藏",
    route: "/pages/detail/pet-social/index",
  },
  {
    id: "home-1",
    title: "今天值得被分享的宠物日常",
    summary: "用轻松的卡片浏览社区里的日常、故事和城市瞬间。",
    image:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80",
    badge: "宠物圈",
    author: "雪球",
    meta: "2分钟前 · 36 评论",
    route: "/pages/detail/pet-social/index",
  },
  {
    id: "home-2",
    title: "猫咪春天第一次出门晒太阳猫咪春天第一次出门晒太阳猫咪春天第一次出门晒太阳",
    summary: "柔软的午后、轻松的散步和刚刚好的阳光。",
    image:
      "https://images.unsplash.com/photo-1571566882372-1598d88abd90?auto=format&fit=crop&w=900&q=80",
    badge: "晒日常",
    author: "团子",
    meta: "15分钟前 · 12 点赞",
    route: "/pages/detail/pet-social/index",
  },
  {
    id: "home-3",
    title: "在城市里认真分享一只小狗的成长",
    summary: "记录、成长、陪伴，是这个首页最温柔的关键词。",
    image:
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80",
    badge: "成长记录",
    author: "糯米",
    meta: "1小时前 · 8 收藏",
    route: "/pages/detail/pet-social/index",
  },
];

export const SERVICE_FEEDS: FeedCard[] = [
  {
    id: "service-1",
    title: "未央区可上门喂养，拍照反馈很及时",
    summary: "上门喂食、换水、清理猫砂，工作日晚间和周末都可约。",
    image:
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=900&q=80",
    badge: "上门喂养",
    author: "糯米和团子的家",
    meta: "服务中 · 3.8km",
    route: "/pages/detail/service/index",
  },
  {
    id: "service-2",
    title: "高新区短期寄养，单独房间更安心",
    summary: "适合短途出差和节假日寄养，提供日常反馈。",
    image:
      "https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=900&q=80",
    badge: "宠物寄养",
    author: "阿喵的家",
    meta: "服务中 · 4.2km",
    route: "/pages/detail/service/index",
  },
  {
    id: "service-3",
    title: "闲置猫爬架和饮水机，成色很好",
    summary: "支持同城自提，也可以商议配送或当面交易。",
    image:
      "https://images.unsplash.com/photo-1558944351-cd4de83d3fb8?auto=format&fit=crop&w=900&q=80",
    badge: "闲置",
    author: "团子",
    meta: "刚发布 · 价格友好",
    route: "/pages/detail/pet-social/index",
  },
];

export const NOTIFICATION_CARDS: NotificationCard[] = [
  {
    id: "notif-1",
    type: "CONTACT_REQUEST",
    title: "收到联系申请",
    summary: "“糯米和团子的家” 的服务帖有人想交换联系方式。",
    time: "2分钟前",
    unread: true,
  },
  {
    id: "notif-2",
    type: "COMMENT_POST",
    title: "新评论",
    summary: "雪球 回复了你发布的宠物圈帖子。",
    time: "12分钟前",
    unread: true,
  },
  {
    id: "notif-3",
    type: "LIKE_POST",
    title: "新增点赞",
    summary: "团子 赞了你的一条分享内容。",
    time: "1小时前",
    unread: false,
  },
];

export const PUBLISH_TYPES: PublishTypeCard[] = [
  {
    key: "PET_SOCIAL",
    title: "发布宠物圈",
    description: "晒宠物日常、分享救助故事、记录有趣瞬间。",
    chip: "内容分享",
  },
  {
    key: "SERVICE",
    title: "发布服务",
    description: "寄养、领养、上门喂养等本地结构化服务信息。",
    chip: "结构化信息",
  },
  {
    key: "RESALE",
    title: "发布闲置",
    description: "二手用品、猫爬架、饮水机等同城交易内容。",
    chip: "同城交易",
  },
];

export const PROFILE_ACTIONS: ProfileAction[] = [
  {
    id: "favorites",
    title: "我的收藏",
    summary: "查看已收藏的内容与服务卡片。",
  },
  {
    id: "posts",
    title: "我的发布",
    summary: "管理全部发布内容和审核状态。",
  },
  {
    id: "edit",
    title: "编辑资料",
    summary: "头像、昵称和手机号绑定状态。",
  },
];

export const SERVICE_TABS = ["全部", "领养", "寄养", "喂养", "闲置"];

export const HOME_TAGS = ["晒日常", "流浪救助", "领养故事", "城市宠物"];

export const SERVICE_TAGS = ["领养寄养", "上门喂养", "同城闲置", "实时反馈"];
