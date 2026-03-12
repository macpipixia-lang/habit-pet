import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { hasAnyUserPet } from "@/lib/data";

export async function PetOnboardingGuard({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireUser();
  const hasPets = await hasAnyUserPet(user.id);

  if (!hasPets) {
    redirect("/onboarding/pet-egg");
  }

  return <>{children}</>;
}
