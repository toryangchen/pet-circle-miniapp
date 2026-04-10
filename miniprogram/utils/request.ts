import {
  ensureAuthenticated,
  recoverSession,
} from "./session";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

type ApiEnvelope<T> = {
  code: number;
  message: string;
  data: T;
};

export type RequestOptions = {
  method: HttpMethod;
  path: string;
  data?: WechatMiniprogram.IAnyObject | string | ArrayBuffer;
};

export class ApiRequestError extends Error {
  statusCode?: number;

  bodyCode?: number;

  constructor(message: string, options?: { statusCode?: number; bodyCode?: number }) {
    super(message);
    this.name = "ApiRequestError";
    this.statusCode = options?.statusCode;
    this.bodyCode = options?.bodyCode;
  }
}

const DEFAULT_API_BASE_URL = "https://pet.toryang.cc/api";

function getApiBaseUrl() {
  return DEFAULT_API_BASE_URL;
}

function isUnauthorizedError(error: unknown) {
  return error instanceof ApiRequestError && error.statusCode === 401;
}

function getAuthHeader(token?: string | null) {
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

function requestRaw<T>(options: RequestOptions, token?: string | null): Promise<T> {
  const url = `${getApiBaseUrl()}${options.path}`;
  const headers = {
    "content-type": "application/json",
    ...getAuthHeader(token),
  };

  return new Promise<T>((resolve, reject) => {
    wx.request({
      url,
      method: options.method as WechatMiniprogram.RequestOption["method"],
      data: options.data,
      header: headers,
      timeout: 3000,
      success: (response) => {
        const body = response.data as ApiEnvelope<T> | undefined;
        if (response.statusCode >= 200 && response.statusCode < 300 && body?.code === 0) {
          resolve(body.data);
          return;
        }

        reject(
          new ApiRequestError(body?.message || `HTTP ${response.statusCode}`, {
            statusCode: response.statusCode,
            bodyCode: body?.code,
          }),
        );
      },
      fail: () => {
        reject(new ApiRequestError("Network request failed."));
      },
    });
  });
}

export async function request<T>(options: RequestOptions): Promise<T> {
  return requestWithAuth<T>(options);
}

export async function requestWithAuth<T>(options: RequestOptions): Promise<T> {
  const session = await ensureAuthenticated();

  try {
    return await requestRaw<T>(options, session.token);
  } catch (error) {
    if (!isUnauthorizedError(error)) {
      throw error;
    }

    const recoveredSession = await recoverSession();
    return requestRaw<T>(options, recoveredSession.token);
  }
}
