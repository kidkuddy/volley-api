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

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: { select: { name: true, email: true, image: true } } },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("GET /api/workspaces/[id]/members error:", error);
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
    const currentMember = await getWorkspaceMember(workspaceId, session.user.id);
    if (!currentMember) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 });
    }
    if (currentMember.role !== "MANAGER") {
      return NextResponse.json({ error: "Only managers can invite members" }, { status: 403 });
    }

    const { email, role = "CONSUMER" } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "User not found with that email" }, { status: 404 });
    }

    const existing = await getWorkspaceMember(workspaceId, user.id);
    if (existing) {
      return NextResponse.json({ error: "User is already a member" }, { status: 409 });
    }

    const newMember = await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: user.id,
        role: role === "MANAGER" ? "MANAGER" : "CONSUMER",
      },
      include: { user: { select: { name: true, email: true, image: true } } },
    });

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    console.error("POST /api/workspaces/[id]/members error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
