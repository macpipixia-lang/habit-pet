import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "habit_pet_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("SESSION_SECRET is not set");
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
