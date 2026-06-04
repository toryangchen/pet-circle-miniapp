# Pet Circle Miniapp

`pet-circle-miniapp` 是「宠友圈」微信小程序端，面向普通养宠用户。

当前技术栈：

- WeChat Mini Program
- TypeScript
- Less
- Skyline / glass-easel 配置
- 腾讯云 COS 小程序 SDK

## 已实现页面

- `pages/tabbar/home/index`：首页宠物圈 feed
- `pages/tabbar/service/index`：服务/闲置 feed
- `pages/tabbar/message/index`：消息页
- `pages/tabbar/personal/index`：我的
- `pages/profileEdit/index`：资料编辑
- `pages/publish/index`：发布页
- `pages/detail/pet-social/index`：帖子详情
- `pages/detail/pet-social/comment/index`：评论输入页

## 已实现能力

- 自定义底部导航：首页 / 服务 / 中间发布入口 / 消息 / 我的
- 登录态存储、恢复、401 后重新登录
- 小程序登录与手机号绑定流程封装
- 统一 POST 请求封装
- 首页/服务 feed 请求
- 帖子详情、评论列表、评论发布
- 点赞/取消点赞
- 收藏/取消收藏
- 联系发布者申请
- 我的发布、浏览历史、个人资料编辑
- COS 上传凭证获取与上传封装
- 页面源码与工具函数测试

## 本地开发

1. 安装依赖

```bash
npm install
```

2. 类型检查和测试

```bash
npm run test
```

3. 使用微信开发者工具打开 `pet-circle-miniapp` 目录。

当前 API 默认地址写在：

- `miniprogram/utils/request.ts`
- `miniprogram/utils/session.ts`

默认值为：

```text
https://pet.toryang.cc/api
```

如需本地联调，请将其改为本机可被微信开发者工具访问的后端地址。

## 常用命令

```bash
npm run typecheck
npm run test:unit
npm run test
npm run format
npm run format:check
```
