const MOCK_SESSION_KEY = 'pc_mock_session';

export interface MockSession {
  userId: string;
  token: string;
  nickname: string;
}

export function ensureMockSession(): MockSession {
  const current = wx.getStorageSync(MOCK_SESSION_KEY) as MockSession | undefined;
  if (current?.token) {
    return current;
  }

  const next: MockSession = {
    userId: 'mock-user-1',
    token: 'mock-miniapp-token',
    nickname: '糯米和团子的家',
  };

  wx.setStorageSync(MOCK_SESSION_KEY, next);
  wx.setStorageSync('pc_mock_token', next.token);

  return next;
}

export function getMockSession() {
  return wx.getStorageSync(MOCK_SESSION_KEY) as MockSession | undefined;
}

