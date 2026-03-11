import { SHANGHAI_OFFSET_HOURS } from "@/lib/constants";

const DAY_MS = 24 * 60 * 60 * 1000;

function toShanghaiShifted(date: Date) {
  return new Date(date.getTime() + SHANGHAI_OFFSET_HOURS * 60 * 60 * 1000);
}

function fromShanghaiShifted(date: Date) {
  return new Date(date.getTime() - SHANGHAI_OFFSET_HOURS * 60 * 60 * 1000);
}

export function getShanghaiDateKey(now = new Date()) {
  const shifted = toShanghaiShifted(now);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const day = String(shifted.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getShanghaiDateParts(now = new Date()) {
  const today = getShanghaiDateKey(now);
  const shifted = toShanghaiShifted(now);
  const yesterday = getShanghaiDateKey(new Date(fromShanghaiShifted(shifted).getTime() - DAY_MS));

  return {
    today,
    yesterday,
  };
}

export function compareDateKeys(a: string, b: string) {
  if (a === b) {
    return 0;
  }

  return a < b ? -1 : 1;
}

export function addDaysToDateKey(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day));
  shifted.setUTCDate(shifted.getUTCDate() + days);

  const nextYear = shifted.getUTCFullYear();
  const nextMonth = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const nextDay = String(shifted.getUTCDate()).padStart(2, "0");

  return `${nextYear}-${nextMonth}-${nextDay}`;
}

export function formatShanghaiDate(date: Date | string) {
  const value = typeof date === "string" ? new Date(date) : date;

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Shanghai",
  }).format(value);
}
