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
  { params }: { params: Promise<{ workspaceId: string; requestId: string; payloadId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, payloadId } = await params;
    const member = await getWorkspaceMember(workspaceId, session.user.id);
    if (!member) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 });
    }

    const existing = await prisma.savedPayload.findUnique({ where: { id: payloadId } });
    if (!existing) {
      return NextResponse.json({ error: "Payload not found" }, { status: 404 });
    }

    // Consumers can only update their own non-shared payloads
    if (member.role === "CONSUMER" && (existing.isShared && existing.userId !== session.user.id)) {
      return NextResponse.json({ error: "Cannot update shared payloads" }, { status: 403 });
    }

    const { name, bodyType, body, headers, isShared } = await req.json();

    // Only managers can toggle shared status
    const shared = isShared !== undefined && member.role === "MANAGER" ? isShared : existing.isShared;

    const payload = await prisma.savedPayload.update({
      where: { id: payloadId },
      data: {
        ...(name !== undefined && { name }),
        ...(bodyType !== undefined && { bodyType }),
        ...(body !== undefined && { body }),
        ...(headers !== undefined && { headers }),
        isShared: shared,
      },
    });

    return NextResponse.json(payload);
  } catch (error) {
    console.error("PUT /api/.../payloads/[payloadId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ workspaceId: string; requestId: string; payloadId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, payloadId } = await params;
    const member = await getWorkspaceMember(workspaceId, session.user.id);
    if (!member) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 });
    }

    const existing = await prisma.savedPayload.findUnique({ where: { id: payloadId } });
    if (!existing) {
      return NextResponse.json({ error: "Payload not found" }, { status: 404 });
    }

    // Consumers can only delete their own non-shared payloads
    if (member.role === "CONSUMER" && (existing.isShared && existing.userId !== session.user.id)) {
      return NextResponse.json({ error: "Cannot delete shared payloads" }, { status: 403 });
    }

    await prisma.savedPayload.delete({ where: { id: payloadId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/.../payloads/[payloadId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
