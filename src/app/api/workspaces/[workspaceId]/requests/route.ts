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

    const requests = await prisma.request.findMany({
      where: { workspaceId },
      include: { savedPayloads: true },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("GET /api/workspaces/[id]/requests error:", error);
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

    const { name, type, method, url, headers, queryParams, bodyType, body, folderId, sortOrder } = await req.json();
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const request = await prisma.request.create({
      data: {
        name,
        type: type || "HTTP",
        method: method || "GET",
        url: url || "",
        headers: headers || [],
        queryParams: queryParams || [],
        bodyType: bodyType || null,
        body: body || null,
        workspaceId,
        folderId: folderId || null,
        sortOrder: sortOrder ?? 0,
      },
      include: { savedPayloads: true },
    });

    return NextResponse.json(request, { status: 201 });
  } catch (error) {
    console.error("POST /api/workspaces/[id]/requests error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
