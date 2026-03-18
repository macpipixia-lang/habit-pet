import { redirect } from "next/navigation";

function toQueryString(params: Record<string, string | string[] | undefined>) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      search.set(key, value);
    } else if (Array.isArray(value)) {
      for (const entry of value) {
        search.append(key, entry);
      }
    }
  }

  const query = search.toString();
  return query ? `?${query}` : "";
}

export default async function TodayPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  redirect(`/dashboard${toQueryString(params)}`);
}
