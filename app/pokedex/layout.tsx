import { PetOnboardingGuard } from "@/components/pet-onboarding-guard";

export default function PokedexLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PetOnboardingGuard>{children}</PetOnboardingGuard>;
}
