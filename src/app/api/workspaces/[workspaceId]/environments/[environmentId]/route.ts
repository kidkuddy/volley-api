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
    if (member.role !== "MANAGER") {
      return NextResponse.json({ error: "Only managers can update environments" }, { status: 403 });
    }

    const { name, variables } = await req.json();

    const environment = await prisma.environment.update({
      where: { id: environmentId },
      data: {
        ...(name !== undefined && { name }),
        ...(variables !== undefined && { variables }),
      },
    });

    return NextResponse.json(environment);
  } catch (error) {
    console.error("PUT /api/.../environments/[environmentId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
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
    if (member.role !== "MANAGER") {
      return NextResponse.json({ error: "Only managers can delete environments" }, { status: 403 });
    }

    await prisma.environment.delete({ where: { id: environmentId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/.../environments/[environmentId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
