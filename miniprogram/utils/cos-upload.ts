import { request } from "./request";

const COS = require("cos-wx-sdk-v5");

type UploadKind = "avatar" | "post-image";

type CosStsResponse = {
  bucket: string;
  region: string;
  key: string;
  resourceUrl: string;
  startTime: number;
  expiredTime: number;
  credentials: {
    tmpSecretId: string;
    tmpSecretKey: string;
    sessionToken: string;
  };
};

type UploadImageOptions = {
  kind: UploadKind;
  filePath: string;
  filename?: string;
};

function resolveFilename(filePath: string, filename?: string) {
  if (filename) {
    return filename;
  }

  const pathParts = filePath.split("/");
  return pathParts[pathParts.length - 1] || "upload.jpg";
}

export async function uploadImageToCos(options: UploadImageOptions) {
  const filename = resolveFilename(options.filePath, options.filename);
  const ticket = await request<CosStsResponse>({
    method: "POST",
    path: "/assets/cos-sts",
    data: {
      kind: options.kind,
      filename,
    },
  });

  const cos = new COS({
    SimpleUploadMethod: "putObject",
    getAuthorization(
      _requestOptions: unknown,
      callback: (payload: {
        TmpSecretId: string;
        TmpSecretKey: string;
        SecurityToken: string;
        StartTime: number;
        ExpiredTime: number;
      }) => void,
    ) {
      callback({
        TmpSecretId: ticket.credentials.tmpSecretId,
        TmpSecretKey: ticket.credentials.tmpSecretKey,
        SecurityToken: ticket.credentials.sessionToken,
        StartTime: ticket.startTime,
        ExpiredTime: ticket.expiredTime,
      });
    },
  });

  await new Promise<void>((resolve, reject) => {
    cos.putObject(
      {
        Bucket: ticket.bucket,
        Region: ticket.region,
        Key: ticket.key,
        FilePath: options.filePath,
      },
      (error: unknown) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      },
    );
  });

  return {
    url: ticket.resourceUrl,
    key: ticket.key,
  };
}
