import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getWorkspaceMember(workspaceId: string, userId: string) {
  return prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
}

export async function GET(
  _req: Request,
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

    const folders = await prisma.folder.findMany({
      where: { workspaceId, parentFolderId: null },
      include: {
        subFolders: {
          include: {
            subFolders: true,
            requests: true,
          },
          orderBy: { sortOrder: "asc" },
        },
        requests: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(folders);
  } catch (error) {
    console.error("GET /api/workspaces/[id]/folders error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
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

    const { name, parentFolderId, sortOrder } = await req.json();
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const folder = await prisma.folder.create({
      data: {
        name,
        workspaceId,
        parentFolderId: parentFolderId || null,
        sortOrder: sortOrder ?? 0,
      },
      include: { subFolders: true, requests: true },
    });

    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    console.error("POST /api/workspaces/[id]/folders error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
