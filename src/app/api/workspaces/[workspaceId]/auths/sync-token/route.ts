import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getWorkspaceMember(workspaceId: string, userId: string) {
  return prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await params;
    const member = await getWorkspaceMember(workspaceId, session.user.id);
    if (!member) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 });
    }

    const { token, environmentId } = await req.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Update all bearer auth credentials for this workspace (and optionally environment)
    const where: Record<string, unknown> = {
      workspaceId,
      authType: "bearer",
    };
    if (environmentId) {
      where.environmentId = environmentId;
    }

    const result = await prisma.savedAuth.updateMany({
      where,
      data: {
        credentials: { token },
      },
    });

    return NextResponse.json({ updated: result.count });
  } catch (error) {
    console.error("POST /api/.../auths/sync-token error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
