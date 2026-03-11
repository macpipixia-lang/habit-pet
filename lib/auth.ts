import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "habit_pet_session";
const ADMIN_COOKIE = "habit_pet_admin";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("SESSION_SECRET is not set");
  }

  return secret;
}

function getAdminSecret() {
  const secret = process.env.ADMIN_SECRET;

  // 开发态兜底：如果没配置 ADMIN_SECRET，默认使用固定初始密码。
  // 生产环境必须显式配置，否则直接报错。
  if (!secret) {
    if (process.env.NODE_ENV !== "production") {
      return "asdasd1";
    }

    throw new Error("ADMIN_SECRET is not set");
  }

  return secret;
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");

  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, passwordHash: string) {
  const [salt, storedHash] = passwordHash.split(":");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");

  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(storedHash, "hex"));
}

function sign(payload: string) {
  return crypto.createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
}

function signAdmin(payload: string) {
  return crypto.createHmac("sha256", getAdminSecret()).update(payload).digest("hex");
}

function encodeSession(userId: string) {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `${userId}.${expiresAt}`;
  const signature = sign(payload);

  return `${payload}.${signature}`;
}

function decodeSession(value: string) {
  const parts = value.split(".");

  if (parts.length !== 3) {
    return null;
  }

  const [userId, expiresAt, signature] = parts;
  const payload = `${userId}.${expiresAt}`;

  if (sign(payload) !== signature) {
    return null;
  }

  if (Number(expiresAt) < Date.now()) {
    return null;
  }

  return { userId };
}

function encodeAdminSession() {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `admin.${expiresAt}`;
  const signature = signAdmin(payload);

  return `${payload}.${signature}`;
}

function decodeAdminSession(value: string) {
  const parts = value.split(".");

  if (parts.length !== 3) {
    return null;
  }

  const [role, expiresAt, signature] = parts;
  const payload = `${role}.${expiresAt}`;

  if (role !== "admin") {
    return null;
  }

  if (signAdmin(payload) !== signature) {
    return null;
  }

  if (Number(expiresAt) < Date.now()) {
    return null;
  }

  return { isAdmin: true };
}

export async function createSession(userId: string) {
  const store = await cookies();

  store.set(SESSION_COOKIE, encodeSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function createAdminSession() {
  const store = await cookies();

  store.set(ADMIN_COOKIE, encodeAdminSession(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

export async function getCurrentUser() {
  const store = await cookies();
  const session = store.get(SESSION_COOKIE)?.value;

  if (!session) {
    return null;
  }

  const decoded = decodeSession(session);

  if (!decoded) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: decoded.userId },
    include: {
      profile: true,
    },
  });
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth");
  }

  return user;
}

export async function isAdminAuthenticated() {
  const store = await cookies();
  const session = store.get(ADMIN_COOKIE)?.value;

  if (!session) {
    return false;
  }

  return Boolean(decodeAdminSession(session));
}

export async function requireAdmin() {
  const isAdmin = await isAdminAuthenticated();

  if (!isAdmin) {
    redirect("/admin");
  }
}

export function verifyAdminSecret(secret: string) {
  const configuredSecret = getAdminSecret();

  if (secret.length !== configuredSecret.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(secret), Buffer.from(configuredSecret));
}
