import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user;
}

export async function requireWorkspaceAccess(workspaceId: string, requiredRole?: "MANAGER" | "CONSUMER") {
  const user = await requireAuth();

  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId: user.id },
    },
  });

  if (!member) {
    redirect("/app");
  }

  if (requiredRole === "MANAGER" && member.role !== "MANAGER") {
    throw new Error("Insufficient permissions");
  }

  return { user, member };
}
