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

  const payload = (await response.json()) as UploadResponse | { error?: string };

  if (!response.ok || !("url" in payload)) {
    throw new Error(("error" in payload && payload.error) || zhCN.feedback.fallbackError);
  }

  return payload;
}
