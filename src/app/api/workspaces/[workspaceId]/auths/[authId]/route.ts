import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getWorkspaceMember(workspaceId: string, userId: string) {
  return prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; authId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, authId } = await params;
    const member = await getWorkspaceMember(workspaceId, session.user.id);
    if (!member) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 });
    }

    const { name, authType, credentials, environmentId } = await req.json();

    const savedAuth = await prisma.savedAuth.update({
      where: { id: authId },
      data: {
        ...(name !== undefined && { name }),
        ...(authType !== undefined && { authType }),
        ...(credentials !== undefined && { credentials }),
        ...(environmentId !== undefined && { environmentId: environmentId || null }),
      },
      include: { environment: { select: { id: true, name: true } } },
    });

    return NextResponse.json(savedAuth);
  } catch (error) {
    console.error("PUT /api/.../auths/[authId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ workspaceId: string; authId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, authId } = await params;
    const member = await getWorkspaceMember(workspaceId, session.user.id);
    if (!member) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 });
    }

    await prisma.savedAuth.delete({ where: { id: authId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/.../auths/[authId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
