import { zhCN } from "@/lib/i18n/zhCN";

export type UploadStatus = "idle" | "uploading" | "success" | "error";

export type UploadResponse = {
  url: string;
  pathname: string;
  contentType: string | null;
  size: number;
};

export function getUploadStatusLabel(status: UploadStatus) {
  switch (status) {
    case "uploading":
      return zhCN.admin.uploadUploading;
    case "success":
      return zhCN.admin.uploadSuccess;
    case "error":
      return zhCN.admin.uploadFailed;
    default:
      return zhCN.admin.uploadIdle;
  }
}

export function getFileNameFromUrl(url: string) {
  try {
    return new URL(url).pathname.split("/").filter(Boolean).pop() ?? url;
  } catch {
    return url;
  }
}

export async function uploadBlobFile(file: File, folder: string) {
  const formData = new FormData();
  formData.set("file", file);
  formData.set("folder", folder);

  const response = await fetch("/api/admin/blob/upload", {
    method: "POST",
    body: formData,
  });

  let payload: UploadResponse | { error?: string } | null = null;

  try {
    payload = (await response.json()) as UploadResponse | { error?: string };
  } catch {
    if (!response.ok) {
      throw new Error("上传服务返回异常，请检查 BLOB_READ_WRITE_TOKEN 和网络连接。");
    }
    throw new Error(zhCN.feedback.fallbackError);
  }

  if (!response.ok || !payload || !("url" in payload)) {
    throw new Error((payload && "error" in payload && payload.error) || zhCN.feedback.fallbackError);
  }

  return payload;
}
