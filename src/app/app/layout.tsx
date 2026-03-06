import { requireAuth } from "@/lib/auth-helpers";
import { AuthProviders } from "@/components/auth-providers";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return <AuthProviders>{children}</AuthProviders>;
}
