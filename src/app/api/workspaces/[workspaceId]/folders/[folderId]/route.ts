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
  { params }: { params: Promise<{ workspaceId: string; folderId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, folderId } = await params;
    const member = await getWorkspaceMember(workspaceId, session.user.id);
    if (!member) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 });
    }

    const { name, parentFolderId, sortOrder } = await req.json();

    const folder = await prisma.folder.update({
      where: { id: folderId },
      data: {
        ...(name !== undefined && { name }),
        ...(parentFolderId !== undefined && { parentFolderId }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
      include: { subFolders: true, requests: true },
    });

    return NextResponse.json(folder);
  } catch (error) {
    console.error("PUT /api/workspaces/[id]/folders/[folderId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ workspaceId: string; folderId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, folderId } = await params;
    const member = await getWorkspaceMember(workspaceId, session.user.id);
    if (!member) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 });
    }

    await prisma.folder.delete({ where: { id: folderId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/workspaces/[id]/folders/[folderId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
