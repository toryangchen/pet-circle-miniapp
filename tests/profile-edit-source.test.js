const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const profileEditPath = path.join(
  __dirname,
  "../miniprogram/pages/profileEdit/index.ts",
);
const profileEditWxmlPath = path.join(
  __dirname,
  "../miniprogram/pages/profileEdit/index.wxml",
);
const source = fs.readFileSync(profileEditPath, "utf8");
const wxmlSource = fs.readFileSync(profileEditWxmlPath, "utf8");

test("profile edit page exposes a shared updateUserProfile helper", () => {
  assert.match(
    source,
    /async updateUserProfile\(payload: UpdateMyProfilePayload\)/,
  );
  assert.match(
    source,
    /method: "POST"[\s\S]*path: "\/users\/me\/profile"/,
  );
});

test("profile avatar upload reuses updateUserProfile helper", () => {
  assert.match(source, /await this\.updateUserProfile\(\{\s*avatarUrl: uploadResult\.url,\s*\}\)/);
});

test("profile phone authorization reuses ensurePhoneAuthorized helper", () => {
  assert.match(source, /import \{ ensurePhoneAuthorized, getAuthState, syncCurrentUser \} from "@utils\/session"/);
  assert.match(source, /await ensurePhoneAuthorized\(code\)/);
});

test("profile edit page opens a background sheet and patches bgType", () => {
  assert.match(source, /isBgTypeSheetVisible: false/);
  assert.match(source, /if \(type === "bgType"\)/);
  assert.match(wxmlSource, /<bg-type-sheet/);
  assert.match(source, /await this\.updateUserProfile\(\{\s*bgType: nextBgType,\s*\}\)/);
});

test("profile edit page opens a gender sheet and updates gender", () => {
  assert.match(source, /wx\.showActionSheet\(/);
  assert.match(source, /if \(type === "gender"\)/);
  assert.doesNotMatch(wxmlSource, /<option-sheet/);
  assert.match(source, /await this\.updateUserProfile\(\{\s*gender: nextGender,\s*\}\)/);
});

test("profile edit page updates birthday and region via native pickers", () => {
  assert.match(wxmlSource, /picker[\s\S]*mode="date"[\s\S]*end="\{\{maxBirthday\}\}"[\s\S]*bindchange="handleBirthdayChange"/);
  assert.match(wxmlSource, /picker[\s\S]*mode="region"[\s\S]*bindchange="handleRegionChange"/);
  assert.match(source, /await this\.updateUserProfile\(\{\s*birthday: value,\s*\}\)/);
  assert.match(
    source,
    /await this\.updateUserProfile\(\{[\s\S]*regionProvince: province,[\s\S]*regionCity: city,[\s\S]*regionDistrict: district,[\s\S]*\}\)/,
  );
});
