import { PetOnboardingGuard } from "@/components/pet-onboarding-guard";

export default function ShopLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PetOnboardingGuard>{children}</PetOnboardingGuard>;
}
