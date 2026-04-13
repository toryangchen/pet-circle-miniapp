const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const profileEditPath = path.join(
  __dirname,
  "../miniprogram/pages/profileEdit/index.ts",
);
const source = fs.readFileSync(profileEditPath, "utf8");

test("profile edit page exposes a shared updateUserProfile helper", () => {
  assert.match(
    source,
    /async updateUserProfile\(payload: UpdateMyProfilePayload\)/,
  );
  assert.match(
    source,
    /method: "PATCH"[\s\S]*path: "\/users\/me\/profile"/,
  );
});

test("profile avatar upload reuses updateUserProfile helper", () => {
  assert.match(source, /await this\.updateUserProfile\(\{\s*avatarUrl: uploadResult\.url,\s*\}\)/);
});

test("profile phone authorization reuses ensurePhoneAuthorized helper", () => {
  assert.match(source, /import \{ ensurePhoneAuthorized, getAuthState, syncCurrentUser \} from "@utils\/session"/);
  assert.match(source, /await ensurePhoneAuthorized\(code\)/);
});
