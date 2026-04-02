import type { MiniappUserSummary } from "./api-types";

const SESSION_STORAGE_KEY = "pc_auth_session";
const DEFAULT_API_BASE_URL = "http://127.0.0.1:3000/api";

type HttpMethod = "GET" | "POST";

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

function getStoredSession() {
  return wx.getStorageSync(SESSION_STORAGE_KEY) as AuthSession | undefined;
}

function saveSession(session: AuthSession) {
  wx.setStorageSync(SESSION_STORAGE_KEY, session);
}

function setAuthState(nextState: Partial<AuthBootstrapState>) {
  authState = {
    ...authState,
    ...nextState,
  };
}

function applyAuthenticatedState(session: AuthSession, user?: MiniappUserSummary | null) {
  const nextUser = user === undefined ? authState.user : user;
  setAuthState({
    isAuthenticated: true,
    session,
    user: nextUser,
    phoneAuthorized: nextUser?.phoneAuthorized ?? false,
    phoneMasked: nextUser?.phoneMasked ?? "",
  });
}

function clearPersistedSession() {
  wx.removeStorageSync(SESSION_STORAGE_KEY);
}

function resetAuthState() {
  clearPersistedSession();
  authState = {
    ...DEFAULT_AUTH_STATE,
    isBootstrapping: authState.isBootstrapping,
  };
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

  saveSession(session);
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

  const storedSession = getStoredSession();
  if (storedSession?.token) {
    applyAuthenticatedState(storedSession);
    return storedSession;
  }

  if (!loginPromise) {
    loginPromise = loginWithWeChatCode().finally(() => {
      loginPromise = null;
    });
  }

  return loginPromise;
}

export async function recoverSession() {
  clearPersistedSession();
  setAuthState({
    isAuthenticated: false,
    session: null,
    user: null,
    phoneAuthorized: false,
    phoneMasked: "",
  });

  return ensureAuthenticated();
}

export async function syncCurrentUser(options?: {
  allowRelogin?: boolean;
}): Promise<MiniappUserSummary | null> {
  const session = authState.session ?? getStoredSession() ?? null;
  if (!session?.token) {
    return null;
  }

  if (!authState.session) {
    applyAuthenticatedState(session);
  }

  if (!currentUserPromise) {
    currentUserPromise = requestApi<MiniappUserSummary>({
      method: "GET",
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
        const storedSession = getStoredSession();
        if (storedSession?.token) {
          applyAuthenticatedState(storedSession);
          try {
            await syncCurrentUser({ allowRelogin: true });
            return;
          } catch {
            resetAuthState();
          }
        }

        try {
          await ensureAuthenticated();
          await syncCurrentUser();
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
