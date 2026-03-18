import { upload } from "@vercel/blob/client";
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

function sanitizeSegment(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9.-]+/g, "-").replace(/^-+|-+$/g, "") || "file";
}

function buildPathname(file: File, folder: string) {
  const extension = file.name.includes(".") ? `.${sanitizeSegment(file.name.split(".").pop() ?? "")}` : "";
  const basename = file.name.replace(/\.[^.]+$/, "");
  return `${sanitizeSegment(folder)}/${Date.now()}-${sanitizeSegment(basename)}${extension}`;
}

function toUploadErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : zhCN.admin.blobUploadFailed;

  if (message.includes("Failed to  retrieve the client token")) {
    return zhCN.admin.blobUploadAuthFailed;
  }

  if (message.includes("access must be \"public\"")) {
    return zhCN.admin.blobStorePublicOnly;
  }

  return message;
}

export async function uploadBlobFile(file: File, folder: string) {
  try {
    const payload = await upload(buildPathname(file, folder), file, {
      access: "public",
      contentType: file.type || undefined,
      handleUploadUrl: "/api/admin/blob/upload",
      clientPayload: JSON.stringify({
        folder,
        contentType: file.type || null,
      }),
      multipart: file.type === "model/gltf-binary" || file.name.toLowerCase().endsWith(".glb"),
    });

    return {
      url: payload.url,
      pathname: payload.pathname,
      contentType: payload.contentType ?? file.type ?? null,
      size: file.size,
    };
  } catch (error) {
    throw new Error(toUploadErrorMessage(error));
  }
}
