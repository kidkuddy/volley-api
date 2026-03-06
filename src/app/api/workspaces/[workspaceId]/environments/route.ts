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

    const environments = await prisma.environment.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(environments);
  } catch (error) {
    console.error("GET /api/.../environments error:", error);
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
    if (member.role !== "MANAGER") {
      return NextResponse.json({ error: "Only managers can create environments" }, { status: 403 });
    }

    const { name, variables } = await req.json();
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const environment = await prisma.environment.create({
      data: {
        name,
        workspaceId,
        variables: variables || [],
      },
    });

    return NextResponse.json(environment, { status: 201 });
  } catch (error) {
    console.error("POST /api/.../environments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
