const MOCK_SESSION_KEY = 'pc_mock_session';
const DEFAULT_API_BASE_URL = 'http://127.0.0.1:3000/api';

export interface MockSession {
  userId: string;
  token: string;
  nickname: string;
  isMock: boolean;
}

type ApiEnvelope<T> = {
  code: number;
  message: string;
  data: T;
};

function getStoredSession() {
  return wx.getStorageSync(MOCK_SESSION_KEY) as MockSession | undefined;
}

function saveSession(session: MockSession) {
  wx.setStorageSync(MOCK_SESSION_KEY, session);
  wx.setStorageSync('pc_mock_token', session.token);
}

function createFallbackSession(): MockSession {
  return {
    userId: 'mock-user-1',
    token: 'mock-miniapp-token',
    nickname: '糯米和团子的家',
    isMock: true,
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

        reject(new Error('missing login code'));
      },
      fail: reject,
    });
  });
}

function exchangeServerToken(code: string) {
  return new Promise<MockSession>((resolve, reject) => {
    wx.request({
      url: `${DEFAULT_API_BASE_URL}/auth/miniapp/login`,
      method: 'POST',
      header: {
        'content-type': 'application/json',
      },
      data: { code },
      timeout: 3000,
      success: (response) => {
        const body = response.data as
          | ApiEnvelope<{
              token: string;
              user: {
                id: string;
                nickname: string | null;
              };
            }>
          | undefined;

        if (response.statusCode >= 200 && response.statusCode < 300 && body?.code === 0) {
          resolve({
            userId: body.data.user.id,
            token: body.data.token,
            nickname: body.data.user.nickname || '宠友圈用户',
            isMock: false,
          });
          return;
        }

        reject(new Error(body?.message || `HTTP ${response.statusCode}`));
      },
      fail: reject,
    });
  });
}

export async function ensureMockSession(): Promise<MockSession> {
  const current = getStoredSession();
  if (current?.token && !current.isMock) {
    return current;
  }

  try {
    const loginCode = await requestMiniappLoginCode();
    const remoteSession = await exchangeServerToken(loginCode);
    saveSession(remoteSession);
    return remoteSession;
  } catch {
    if (current?.token) {
      return current;
    }

    const fallback = createFallbackSession();
    saveSession(fallback);
    return fallback;
  }
}

export function getMockSession() {
  const current = wx.getStorageSync(MOCK_SESSION_KEY) as MockSession | undefined;
  if (current?.token) {
    return current;
  }

  const fallback = createFallbackSession();
  saveSession(fallback);
  return fallback;
}
