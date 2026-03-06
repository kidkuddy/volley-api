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

    const payloads = await prisma.savedPayload.findMany({
      where: {
        requestId,
        OR: [
          { isShared: true },
          { userId: session.user.id },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(payloads);
  } catch (error) {
    console.error("GET /api/.../payloads error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
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

    const { name, bodyType, body, headers, isShared } = await req.json();
    if (!name || !bodyType || body === undefined) {
      return NextResponse.json({ error: "Name, bodyType, and body are required" }, { status: 400 });
    }

    // Only managers can create shared payloads
    const shared = isShared && member.role === "MANAGER";

    const payload = await prisma.savedPayload.create({
      data: {
        name,
        requestId,
        bodyType,
        body,
        headers: headers || [],
        isShared: shared,
        userId: session.user.id,
      },
    });

    return NextResponse.json(payload, { status: 201 });
  } catch (error) {
    console.error("POST /api/.../payloads error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
