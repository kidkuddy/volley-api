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
  { params }: { params: Promise<{ workspaceId: string; requestId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, requestId } = await params;
    const member = await getWorkspaceMember(workspaceId, session.user.id);
    if (!member) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 });
    }

    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: { savedPayloads: true },
    });

    if (!request || request.workspaceId !== workspaceId) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    return NextResponse.json(request);
  } catch (error) {
    console.error("GET /api/workspaces/[id]/requests/[requestId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ workspaceId: string; requestId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, requestId } = await params;
    const member = await getWorkspaceMember(workspaceId, session.user.id);
    if (!member) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 });
    }

    const { name, type, method, url, headers, queryParams, bodyType, body, folderId, sortOrder } = await req.json();

    const request = await prisma.request.update({
      where: { id: requestId },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(method !== undefined && { method }),
        ...(url !== undefined && { url }),
        ...(headers !== undefined && { headers }),
        ...(queryParams !== undefined && { queryParams }),
        ...(bodyType !== undefined && { bodyType }),
        ...(body !== undefined && { body }),
        ...(folderId !== undefined && { folderId }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
      include: { savedPayloads: true },
    });

    return NextResponse.json(request);
  } catch (error) {
    console.error("PUT /api/workspaces/[id]/requests/[requestId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ workspaceId: string; requestId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, requestId } = await params;
    const member = await getWorkspaceMember(workspaceId, session.user.id);
    if (!member) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 });
    }

    await prisma.request.delete({ where: { id: requestId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/workspaces/[id]/requests/[requestId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
