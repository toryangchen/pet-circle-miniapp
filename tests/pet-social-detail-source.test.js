const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("pet social detail page does not ship Pencil sample defaults", () => {
  const pagePath = path.join(__dirname, "../miniprogram/pages/detail/pet-social/index.ts");
  const source = fs.readFileSync(pagePath, "utf8");

  assert.equal(source.includes("糯米今天终于愿意主动贴贴了"), false);
  assert.equal(source.includes("前几天还总是躲在窗帘后面"), false);
  assert.equal(source.includes("photo-1769256130388"), false);
  assert.equal(source.includes('likeCount: "19"'), false);
  assert.equal(source.includes('commentCount: "32"'), false);
  assert.equal(source.includes('tags: ["猫咪日常", "西安 · 晒猫"]'), false);
});

test("pet social detail hero uses a swipeable image carousel", () => {
  const wxmlPath = path.join(__dirname, "../miniprogram/pages/detail/pet-social/index.wxml");
  const tsPath = path.join(__dirname, "../miniprogram/pages/detail/pet-social/index.ts");
  const wxml = fs.readFileSync(wxmlPath, "utf8");
  const source = fs.readFileSync(tsPath, "utf8");

  assert.equal(wxml.includes("<swiper"), true);
  assert.equal(wxml.includes("<swiper-item"), true);
  assert.equal(wxml.includes('wx:for="{{images}}"'), true);
  assert.equal(wxml.includes('bindchange="onHeroSwiperChange"'), true);
  assert.equal(source.includes("images: [] as string[]"), true);
  assert.equal(source.includes("heroCurrent: 0"), true);
  assert.equal(source.includes("onHeroSwiperChange"), true);
});

test("pet social detail carousel shows dots and image counter", () => {
  const wxmlPath = path.join(__dirname, "../miniprogram/pages/detail/pet-social/index.wxml");
  const lessPath = path.join(__dirname, "../miniprogram/pages/detail/pet-social/index.less");
  const wxml = fs.readFileSync(wxmlPath, "utf8");
  const styles = fs.readFileSync(lessPath, "utf8");

  assert.equal(wxml.includes('class="pet-social-hero__counter"'), true);
  assert.equal(wxml.includes("{{heroCurrent + 1}}/{{images.length}}"), true);
  assert.equal(wxml.includes('wx:if="{{images.length > 1}}" class="pet-social-indicator"'), false);
  assert.equal(wxml.includes('wx:if="{{images.length}}" class="pet-social-indicator"'), true);
  assert.equal(styles.includes(".pet-social-hero__counter {"), true);
});

test("pet social detail carousel images can be previewed", () => {
  const wxmlPath = path.join(__dirname, "../miniprogram/pages/detail/pet-social/index.wxml");
  const tsPath = path.join(__dirname, "../miniprogram/pages/detail/pet-social/index.ts");
  const wxml = fs.readFileSync(wxmlPath, "utf8");
  const source = fs.readFileSync(tsPath, "utf8");

  assert.equal(wxml.includes('bindtap="previewHeroImage"'), true);
  assert.equal(wxml.includes('data-current="{{item}}"'), true);
  assert.equal(source.includes("previewHeroImage("), true);
  assert.equal(source.includes("wx.previewImage({"), true);
  assert.equal(source.includes("current,"), true);
  assert.equal(source.includes("urls: images,"), true);
});

test("pet social detail content restores escaped newlines", () => {
  const tsPath = path.join(__dirname, "../miniprogram/pages/detail/pet-social/index.ts");
  const lessPath = path.join(__dirname, "../miniprogram/pages/detail/pet-social/index.less");
  const source = fs.readFileSync(tsPath, "utf8");
  const styles = fs.readFileSync(lessPath, "utf8");

  assert.equal(source.includes("function restoreEscapedNewlines"), true);
  assert.equal(source.includes("summary: restoreEscapedNewlines(detail.content)"), true);
  assert.equal(styles.includes("white-space: pre-wrap;"), true);
});

test("pet social detail bottom favorite control toggles favorite state", () => {
  const wxmlPath = path.join(__dirname, "../miniprogram/pages/detail/pet-social/index.wxml");
  const source = fs.readFileSync(wxmlPath, "utf8");

  assert.equal(source.includes('src="/assets/icon-love{{favorited ?'), true);
  assert.equal(source.includes("<text>{{favoriteCount}}</text>"), true);
  assert.equal(source.includes('class="pet-social-bottom__like" bindtap="toggleFavorite"'), true);
});

test("pet social detail composer styles are present", () => {
  const lessPath = path.join(__dirname, "../miniprogram/pages/detail/pet-social/index.less");
  const styles = fs.readFileSync(lessPath, "utf8");

  assert.equal(styles.includes(".pet-social-composer {"), true);
  assert.equal(styles.includes("height: 76rpx;"), true);
  assert.equal(styles.includes(".pet-social-avatar {"), true);
  assert.equal(styles.includes("border-radius: 999rpx;"), true);
  assert.equal(styles.includes("justify-content: center;"), true);
  assert.equal(styles.includes("flex-shrink: 0;"), true);
  assert.equal(styles.includes(".pet-social-avatar--composer"), true);
  assert.equal(styles.includes(".pet-social-avatar--composer image"), true);
  assert.equal(styles.includes(".pet-social-composer__input {"), true);
  assert.equal(styles.includes("min-width: 0;"), true);
  assert.equal(styles.includes(".pet-social-composer__send {"), true);
  assert.equal(styles.includes(".pet-social-composer__send[disabled]"), true);
});

test("pet social detail renders real comment avatars and own-comment delete action", () => {
  const wxmlPath = path.join(__dirname, "../miniprogram/pages/detail/pet-social/index.wxml");
  const tsPath = path.join(__dirname, "../miniprogram/pages/detail/pet-social/index.ts");
  const lessPath = path.join(__dirname, "../miniprogram/pages/detail/pet-social/index.less");
  const wxml = fs.readFileSync(wxmlPath, "utf8");
  const source = fs.readFileSync(tsPath, "utf8");
  const styles = fs.readFileSync(lessPath, "utf8");

  assert.equal(
    wxml.includes("src=\"{{item.author.avatarUrl || '/assets/profile-pawpets-avatar.png'}}\""),
    true,
  );
  assert.equal(wxml.includes('wx:if="{{item.canDelete}}"'), true);
  assert.equal(wxml.includes('class="pet-social-comment__delete"'), true);
  assert.equal(wxml.includes('class="pet-social-reply__delete"'), true);
  assert.equal(wxml.includes('bindtap="deleteComment"'), true);
  assert.equal(source.includes('from "@utils/session"'), true);
  assert.equal(source.includes("currentUserId"), true);
  assert.equal(source.includes("canDelete:"), true);
  assert.equal(source.includes("reply.author.id === currentUserId"), true);
  assert.equal(source.includes("path: `/comments/${commentId}`"), true);
  assert.equal(source.includes('method: "DELETE"'), true);
  assert.equal(source.includes("() => removeMockComment(commentId)"), true);
  assert.equal(source.includes("wx.showModal"), true);
  assert.equal(styles.includes(".pet-social-comment__delete {"), true);
  assert.equal(styles.includes(".pet-social-reply__delete {"), true);
  assert.equal(styles.includes(".pet-social-comment__avatar image"), true);
});

test("pet social detail renders an empty state when there are no comments", () => {
  const wxmlPath = path.join(__dirname, "../miniprogram/pages/detail/pet-social/index.wxml");
  const lessPath = path.join(__dirname, "../miniprogram/pages/detail/pet-social/index.less");
  const wxml = fs.readFileSync(wxmlPath, "utf8");
  const styles = fs.readFileSync(lessPath, "utf8");

  assert.equal(wxml.includes('wx:if="{{comments.length}}" class="pet-social-comment-list"'), true);
  assert.equal(wxml.includes('wx:else class="pet-social-comment-empty"'), true);
  assert.equal(wxml.includes('src="/assets/message.svg"'), true);
  assert.equal(wxml.includes("暂无评论，快来抢沙发"), true);
  assert.equal(styles.includes(".pet-social-comment-empty {"), true);
  assert.equal(styles.includes(".pet-social-comment-empty__icon image"), true);
});

test("pet social detail opens comment composer in a Skyline bottom-sheet route", () => {
  const appJson = fs.readFileSync(path.join(__dirname, "../miniprogram/app.json"), "utf8");
  const wxml = fs.readFileSync(
    path.join(__dirname, "../miniprogram/pages/detail/pet-social/index.wxml"),
    "utf8",
  );
  const source = fs.readFileSync(
    path.join(__dirname, "../miniprogram/pages/detail/pet-social/index.ts"),
    "utf8",
  );

  assert.equal(appJson.includes("pages/detail/pet-social/comment/index"), true);
  assert.equal(wxml.includes('id="petSocialComposer"'), false);
  assert.equal(
    wxml.includes('class="pet-social-bottom__input" bindtap="openCommentComposer"'),
    true,
  );
  assert.equal(source.includes("openCommentComposer("), true);
  assert.equal(source.includes('routeType: "wx://bottom-sheet"'), true);
  assert.equal(source.includes("routeConfig"), true);
  assert.equal(source.includes('barrierColor: "rgba(0, 0, 0, 0.16)"'), true);
  assert.equal(source.includes("barrierDismissible: false"), true);
  assert.equal(source.includes("opaque: false"), true);
  assert.equal(source.includes("transitionDuration: 120"), true);
  assert.equal(source.includes("reverseTransitionDuration: 120"), true);
  assert.equal(source.includes("height: 100"), true);
  assert.equal(source.includes("refreshCommentsAfterSubmit"), true);
});

test("pet social detail replies open the same Skyline comment route", () => {
  const wxml = fs.readFileSync(
    path.join(__dirname, "../miniprogram/pages/detail/pet-social/index.wxml"),
    "utf8",
  );
  const source = fs.readFileSync(
    path.join(__dirname, "../miniprogram/pages/detail/pet-social/index.ts"),
    "utf8",
  );

  assert.equal(wxml.includes('bindtap="startReply"'), true);
  assert.equal(source.includes("this.openCommentComposer({"), true);
  assert.equal(source.includes("replyTargetId: commentId,"), true);
  assert.equal(source.includes("replyTargetAuthor: author,"), true);
  assert.equal(source.includes("const query = replyTargetId"), true);
  assert.equal(source.includes("encodeURIComponent(replyTargetAuthor)"), true);
  assert.equal(source.includes("replyTargetId=${replyTargetId}"), true);
  assert.equal(source.includes("replyTargetAuthor=${encodeURIComponent(replyTargetAuthor)}"), true);
});

test("pet social detail applies cached feed card before keeping original requests", () => {
  const tsPath = path.join(__dirname, "../miniprogram/pages/detail/pet-social/index.ts");
  const source = fs.readFileSync(tsPath, "utf8");

  assert.equal(source.includes('from "@utils/detail-prefill"'), true);
  assert.equal(source.includes("applyCachedDetailPrefill(postId)"), true);
  assert.equal(source.includes("consumePetSocialDetailPrefill(postId)"), true);
  assert.equal(source.includes("prefill.isServiceDetail"), true);
  assert.equal(source.includes("wx.getStorageSync(PET_SOCIAL_DETAIL_PREFILL_KEY)"), false);
  assert.equal(source.includes("wx.removeStorageSync(PET_SOCIAL_DETAIL_PREFILL_KEY)"), false);
  assert.equal(source.includes("fetchPetSocialDetail(postId)"), true);
  assert.equal(source.includes("fetchComments(postId)"), true);
});

test("pet social detail renders service-specific sections and bottom actions", () => {
  const tsPath = path.join(__dirname, "../miniprogram/pages/detail/pet-social/index.ts");
  const wxmlPath = path.join(__dirname, "../miniprogram/pages/detail/pet-social/index.wxml");
  const lessPath = path.join(__dirname, "../miniprogram/pages/detail/pet-social/index.less");
  const source = fs.readFileSync(tsPath, "utf8");
  const wxml = fs.readFileSync(wxmlPath, "utf8");
  const styles = fs.readFileSync(lessPath, "utf8");

  assert.equal(source.includes("isServiceDetail"), true);
  assert.equal(source.includes("serviceFields"), true);
  assert.equal(source.includes("serviceDescription"), true);
  assert.equal(source.includes("requestPostContact(postId)"), true);
  assert.equal(source.includes("handleGetPhoneNumber"), true);
  assert.equal(wxml.includes('wx:if="{{isServiceDetail}}" class="pet-social-service-info"'), true);
  assert.equal(wxml.includes("服务信息"), true);
  assert.equal(wxml.includes("服务说明"), true);
  assert.equal(wxml.includes('wx:if="{{!isServiceDetail}}" class="pet-social-bottom"'), true);
  assert.equal(
    wxml.includes('wx:if="{{isServiceDetail}}" class="pet-social-service-bottom"'),
    true,
  );
  const serviceBottomStart = wxml.indexOf(
    'wx:if="{{isServiceDetail}}" class="pet-social-service-bottom"',
  );
  const serviceBottom = wxml.slice(serviceBottomStart);
  assert.equal(serviceBottom.includes('src="/assets/message.svg"'), true);
  assert.equal(serviceBottom.includes('bindtap="openCommentComposer"'), true);
  assert.equal(
    serviceBottom.indexOf('bindtap="toggleFavorite"') <
      serviceBottom.indexOf('bindtap="openCommentComposer"'),
    true,
  );
  assert.equal(
    serviceBottom.indexOf('bindtap="openCommentComposer"') <
      serviceBottom.indexOf('open-type="share"'),
    true,
  );
  assert.equal(wxml.includes("联系发布者"), true);
  assert.equal(styles.includes(".pet-social-service-info {"), true);
  assert.equal(styles.includes(".pet-social-service-bottom {"), true);
  assert.equal(styles.includes(".pet-social-service-bottom__icon {"), true);
  assert.equal(styles.includes(".pet-social-service-bottom__primary {"), true);
});
