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
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, memberId } = await params;
    const currentMember = await getWorkspaceMember(workspaceId, session.user.id);
    if (!currentMember) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 });
    }
    if (currentMember.role !== "MANAGER") {
      return NextResponse.json({ error: "Only managers can update member roles" }, { status: 403 });
    }

    const { role } = await req.json();
    if (!role || !["MANAGER", "CONSUMER"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const updated = await prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role },
      include: { user: { select: { name: true, email: true, image: true } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/workspaces/[id]/members/[memberId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, memberId } = await params;
    const currentMember = await getWorkspaceMember(workspaceId, session.user.id);
    if (!currentMember) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 });
    }
    if (currentMember.role !== "MANAGER") {
      return NextResponse.json({ error: "Only managers can remove members" }, { status: 403 });
    }

    // Prevent removing yourself
    const targetMember = await prisma.workspaceMember.findUnique({ where: { id: memberId } });
    if (targetMember?.userId === session.user.id) {
      return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
    }

    await prisma.workspaceMember.delete({ where: { id: memberId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/workspaces/[id]/members/[memberId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
