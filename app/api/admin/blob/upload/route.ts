import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";

export const runtime = "nodejs";

function sanitizeSegment(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9.-]+/g, "-").replace(/^-+|-+$/g, "") || "file";
}

async function putBlob(
  pathname: string,
  file: File,
  token: string,
): Promise<{ url: string; pathname: string; contentType?: string | null }> {
  const importer = new Function("specifier", "return import(specifier)") as (specifier: string) => Promise<{
    put: (
      pathname: string,
      body: File,
      options: {
        access: "public";
        token: string;
        addRandomSuffix: boolean;
        contentType?: string;
      },
    ) => Promise<{ url: string; pathname: string; contentType?: string | null }>;
  }>;
  const { put } = await importer("@vercel/blob");

  return put(pathname, file, {
    access: "public",
    token,
    addRandomSuffix: false,
    contentType: file.type || undefined,
  });
}

export async function POST(request: Request) {
  try {
    const isAdmin = await isAdminAuthenticated();

    if (!isAdmin) {
      return NextResponse.json({ error: "未授权访问。" }, { status: 401 });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: "BLOB_READ_WRITE_TOKEN 未配置，当前环境无法上传文件。" },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const folderValue = typeof formData.get("folder") === "string" ? String(formData.get("folder")) : "pet-assets";
    const folder = sanitizeSegment(folderValue);

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "未检测到可上传的文件。" }, { status: 400 });
    }

    const extension = file.name.includes(".") ? `.${sanitizeSegment(file.name.split(".").pop() ?? "")}` : "";
    const basename = file.name.replace(/\.[^.]+$/, "");
    const pathname = `${folder}/${Date.now()}-${sanitizeSegment(basename)}${extension}`;

    const blob = await putBlob(pathname, file, process.env.BLOB_READ_WRITE_TOKEN);

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType ?? file.type ?? null,
      size: file.size,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "上传失败，请稍后重试。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
