import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getPetPageState } from "@/lib/data";
import { Pet3DCard } from "@/modules/pet3d/Pet3DCard";
import { isPet3DEnabled } from "@/modules/pet3d/pet3d";

export default async function Pet3DPage() {
  if (!isPet3DEnabled()) {
    redirect("/pet");
  }

  const user = await requireUser();
  const state = await getPetPageState(user.id);

  if (!state.activePet) {
    redirect("/pet");
  }

  return <Pet3DCard pet={state.activePet} />;
}
