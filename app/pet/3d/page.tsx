export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getPetPageState } from "@/lib/data";
import { Pet3DCard } from "@/modules/pet3d/Pet3DCard";
import { isPet3DEnabled } from "@/modules/pet3d/pet3d";

export default async function Pet3DPage() {
  // 这里强制动态渲染，确保切换出战宠物或升级阶段后再次进入页面能拿到最新模型。
  if (!isPet3DEnabled()) {
    redirect("/dashboard");
  }

  const user = await requireUser();
  const state = await getPetPageState(user.id);

  if (!state.activePet) {
    redirect("/dashboard");
  }

  return <Pet3DCard pet={state.activePet} />;
}
