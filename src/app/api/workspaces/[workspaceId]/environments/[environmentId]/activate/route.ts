import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getWorkspaceMember(workspaceId: string, userId: string) {
  return prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ workspaceId: string; environmentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, environmentId } = await params;
    const member = await getWorkspaceMember(workspaceId, session.user.id);
    if (!member) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 });
    }

    // Deactivate all environments in the workspace, then activate the target
    await prisma.$transaction([
      prisma.environment.updateMany({
        where: { workspaceId },
        data: { isActive: false },
      }),
      prisma.environment.update({
        where: { id: environmentId },
        data: { isActive: true },
      }),
    ]);

    const environment = await prisma.environment.findUnique({
      where: { id: environmentId },
    });

    return NextResponse.json(environment);
  } catch (error) {
    console.error("POST /api/.../environments/[environmentId]/activate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
