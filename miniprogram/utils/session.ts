import type { MiniappUserSummary } from "./api-types";

const DEFAULT_API_BASE_URL = "https://pet.toryang.cc/api";

type HttpMethod = "POST";

type ApiEnvelope<T> = {
  code: number;
  message: string;
  data: T;
};

type RequestOptions = {
  method: HttpMethod;
  path: string;
  data?: WechatMiniprogram.IAnyObject | string | ArrayBuffer;
  token?: string;
};

export type AuthSession = {
  userId: string;
  token: string;
  nickname: string;
};

export type AuthBootstrapState = {
  isBootstrapping: boolean;
  isAuthenticated: boolean;
  session: AuthSession | null;
  user: MiniappUserSummary | null;
  phoneAuthorized: boolean;
  phoneMasked: string;
};

export class SessionRequestError extends Error {
  statusCode?: number;

  bodyCode?: number;

  constructor(message: string, options?: { statusCode?: number; bodyCode?: number }) {
    super(message);
    this.name = "SessionRequestError";
    this.statusCode = options?.statusCode;
    this.bodyCode = options?.bodyCode;
  }
}

const DEFAULT_AUTH_STATE: AuthBootstrapState = {
  isBootstrapping: false,
  isAuthenticated: false,
  session: null,
  user: null,
  phoneAuthorized: false,
  phoneMasked: "",
};

const SESSION_STORAGE_KEY = "pet_circle_miniapp_session";

let authState: AuthBootstrapState = { ...DEFAULT_AUTH_STATE };
let bootstrapPromise: Promise<void> | null = null;
let loginPromise: Promise<AuthSession> | null = null;
let currentUserPromise: Promise<MiniappUserSummary | null> | null = null;

function getApiBaseUrl() {
  return DEFAULT_API_BASE_URL;
}

function cloneUser(user: MiniappUserSummary | null) {
  return user ? { ...user } : null;
}

function cloneSession(session: AuthSession | null) {
  return session ? { ...session } : null;
}

function isStoredSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<AuthSession>;
  return (
    typeof candidate.userId === "string" &&
    typeof candidate.token === "string" &&
    typeof candidate.nickname === "string" &&
    Boolean(candidate.userId) &&
    Boolean(candidate.token)
  );
}

function readStoredSession() {
  try {
    const value = wx.getStorageSync(SESSION_STORAGE_KEY);
    return isStoredSession(value) ? value : null;
  } catch {
    return null;
  }
}

function writeStoredSession(session: AuthSession) {
  try {
    wx.setStorageSync(SESSION_STORAGE_KEY, session);
  } catch {
    // Storage failures should not block the active in-memory login state.
  }
}

function removeStoredSession() {
  try {
    wx.removeStorageSync(SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage cleanup failures; the next 401 will force a fresh login.
  }
}

function setAuthState(nextState: Partial<AuthBootstrapState>) {
  authState = {
    ...authState,
    ...nextState,
  };
}

function applyAuthenticatedState(session: AuthSession, user?: MiniappUserSummary | null) {
  const nextUser = user === undefined ? authState.user : user;
  const nextSession = {
    ...session,
    nickname: nextUser?.nickname || session.nickname,
  };
  setAuthState({
    isAuthenticated: true,
    session: nextSession,
    user: nextUser,
    phoneAuthorized: nextUser?.phoneAuthorized ?? false,
    phoneMasked: nextUser?.phoneMasked ?? "",
  });
  writeStoredSession(nextSession);
}

function resetAuthState() {
  authState = {
    ...DEFAULT_AUTH_STATE,
    isBootstrapping: authState.isBootstrapping,
  };
  removeStoredSession();
}

function requestMiniappLoginCode() {
  return new Promise<string>((resolve, reject) => {
    wx.login({
      success: (result) => {
        if (result.code) {
          resolve(result.code);
          return;
        }

        reject(new SessionRequestError("WeChat login code is missing."));
      },
      fail: () => {
        reject(new SessionRequestError("WeChat login failed."));
      },
    });
  });
}

function requestApi<T>(options: RequestOptions): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    wx.request({
      url: `${getApiBaseUrl()}${options.path}`,
      method: options.method as WechatMiniprogram.RequestOption["method"],
      data: options.data,
      timeout: 5000,
      header: {
        "content-type": "application/json",
        ...(options.token
          ? {
              Authorization: `Bearer ${options.token}`,
            }
          : {}),
      },
      success: (response) => {
        const body = response.data as ApiEnvelope<T> | undefined;

        if (response.statusCode >= 200 && response.statusCode < 300 && body?.code === 0) {
          resolve(body.data);
          return;
        }

        reject(
          new SessionRequestError(body?.message || `HTTP ${response.statusCode}`, {
            statusCode: response.statusCode,
            bodyCode: body?.code,
          }),
        );
      },
      fail: () => {
        reject(new SessionRequestError("Network request failed."));
      },
    });
  });
}

function isUnauthorizedError(error: unknown) {
  return error instanceof SessionRequestError && error.statusCode === 401;
}

async function loginWithWeChatCode() {
  const code = await requestMiniappLoginCode();
  const result = await requestApi<{
    token: string;
    user: MiniappUserSummary;
  }>({
    method: "POST",
    path: "/auth/miniapp/login",
    data: { code },
  });
  const session: AuthSession = {
    userId: result.user.id,
    token: result.token,
    nickname: result.user.nickname || "宠友圈用户",
  };

  applyAuthenticatedState(session, result.user);

  return session;
}

export function getCurrentSession() {
  return cloneSession(authState.session);
}

export function getAuthState() {
  return {
    ...authState,
    session: cloneSession(authState.session),
    user: cloneUser(authState.user),
  };
}

export function clearSession() {
  resetAuthState();
}

export async function ensureAuthenticated(): Promise<AuthSession> {
  if (authState.session?.token) {
    return cloneSession(authState.session) as AuthSession;
  }

  if (!loginPromise) {
    loginPromise = loginWithWeChatCode().finally(() => {
      loginPromise = null;
    });
  }

  return loginPromise;
}

export async function recoverSession() {
  setAuthState({
    isAuthenticated: false,
    session: null,
    user: null,
    phoneAuthorized: false,
    phoneMasked: "",
  });
  removeStoredSession();

  return ensureAuthenticated();
}

export async function syncCurrentUser(options?: {
  allowRelogin?: boolean;
}): Promise<MiniappUserSummary | null> {
  const session = authState.session ?? null;
  if (!session?.token) {
    return null;
  }

  if (!authState.session) {
    applyAuthenticatedState(session);
  }

  if (!currentUserPromise) {
    currentUserPromise = requestApi<MiniappUserSummary>({
      method: "POST",
      path: "/auth/me",
      token: session.token,
    })
      .then((user) => {
        applyAuthenticatedState(session, user);
        return user;
      })
      .catch(async (error) => {
        if (options?.allowRelogin && isUnauthorizedError(error)) {
          await recoverSession();
          currentUserPromise = null;
          return syncCurrentUser({ allowRelogin: false });
        }

        if (isUnauthorizedError(error)) {
          resetAuthState();
        }

        throw error;
      })
      .finally(() => {
        currentUserPromise = null;
      });
  }

  return currentUserPromise;
}

export async function bootstrapSession() {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      setAuthState({ isBootstrapping: true });

      try {
        try {
          const storedSession = readStoredSession();
          if (storedSession) {
            applyAuthenticatedState(storedSession);
            await syncCurrentUser({ allowRelogin: true });
          } else {
            await ensureAuthenticated();
          }
        } catch {
          resetAuthState();
        }
      } finally {
        setAuthState({ isBootstrapping: false });
      }
    })().finally(() => {
      bootstrapPromise = null;
    });
  }

  return bootstrapPromise;
}

export async function ensurePhoneAuthorized(phoneCode: string) {
  const session = await ensureAuthenticated();
  const result = await requestApi<{
    phoneAuthorized: boolean;
    phoneMasked: string;
  }>({
    method: "POST",
    path: "/auth/miniapp/bind-phone",
    data: {
      code: phoneCode,
    },
    token: session.token,
  });

  const currentUser = authState.user ?? {
    id: session.userId,
    nickname: session.nickname,
    avatarUrl: null,
    bgType: "main-bg-01",
    gender: null,
    birthday: null,
    region: {
      province: null,
      city: null,
      district: null,
    },
    phoneAuthorized: false,
    profileAuthorized: false,
  };
  const nextUser: MiniappUserSummary = {
    ...currentUser,
    phoneAuthorized: result.phoneAuthorized,
    phoneMasked: result.phoneMasked,
  };

  applyAuthenticatedState(session, nextUser);

  return nextUser;
}
