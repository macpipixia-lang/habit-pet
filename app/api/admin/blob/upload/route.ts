import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { zhCN } from "@/lib/i18n/zhCN";

export const runtime = "nodejs";

function sanitizeSegment(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9.-]+/g, "-").replace(/^-+|-+$/g, "") || "file";
}

function toUploadErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : zhCN.admin.blobUploadFailed;

  if (message.includes('access must be "public"')) {
    return zhCN.admin.blobStorePublicOnly;
  }

  if (message.includes("store does not exist") || message.includes("store has been suspended")) {
    return zhCN.admin.blobStoreUnavailable;
  }

  if (message.includes("BLOB_READ_WRITE_TOKEN")) {
    return zhCN.admin.blobTokenMissing;
  }

  return message;
}

export async function POST(request: Request) {
  try {
    const isAdmin = await isAdminAuthenticated();

    if (!isAdmin) {
      return NextResponse.json({ error: "未授权访问。" }, { status: 401 });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: zhCN.admin.blobTokenMissing },
        { status: 500 },
      );
    }

    const body = (await request.json()) as HandleUploadBody;

    const result = await handleUpload({
      token: process.env.BLOB_READ_WRITE_TOKEN,
      request,
      body,
      onBeforeGenerateToken: async (pathname, clientPayload, multipart) => {
        const parsedPayload = (() => {
          if (!clientPayload) {
            return null;
          }

          try {
            return JSON.parse(clientPayload) as { folder?: string; contentType?: string | null; kind?: string | null };
          } catch {
            return null;
          }
        })();
        const folder = sanitizeSegment(parsedPayload?.folder ?? "pet-assets");
        const requestedName = pathname.split("/").pop() ?? pathname;
        const extension = requestedName.includes(".") ? `.${sanitizeSegment(requestedName.split(".").pop() ?? "")}` : "";
        const basename = requestedName.replace(/\.[^.]+$/, "");
        const isImage = (parsedPayload?.contentType ?? "").startsWith("image/");
        const isGlb = parsedPayload?.contentType === "model/gltf-binary" || extension === ".glb";

        if (!isImage && !isGlb) {
          throw new Error(zhCN.admin.blobUploadTypeInvalid);
        }

        return {
          allowedContentTypes: isImage ? ["image/*"] : ["model/gltf-binary", "application/octet-stream"],
          maximumSizeInBytes: isImage ? 10 * 1024 * 1024 : 200 * 1024 * 1024,
          addRandomSuffix: false,
          validUntil: Date.now() + 60 * 1000,
          tokenPayload: JSON.stringify({
            folder,
            kind: isImage ? "image" : "glb",
            multipart,
          }),
        };
      },
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: toUploadErrorMessage(error) }, { status: 500 });
  }
}
