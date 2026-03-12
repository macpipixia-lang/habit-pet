import { Card } from "@/components/ui";

export function AdminFeedback({
  error,
  successMessage,
}: Readonly<{
  error: string | null;
  successMessage: string | null;
}>) {
  if (error) {
    return <Card className="border-danger/40 bg-danger/10 text-sm text-red-100">{error}</Card>;
  }

  if (successMessage) {
    return (
      <Card className="border-success/40 bg-emerald-500/10 text-sm text-emerald-100">
        {successMessage}
      </Card>
    );
  }

  return null;
}

