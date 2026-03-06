import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [totalUsers, pendingUsers, approvedUsers, totalWorkspaces, totalRequests] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isApproved: false } }),
        prisma.user.count({ where: { isApproved: true } }),
        prisma.workspace.count(),
        prisma.request.count(),
      ]);

    return NextResponse.json({
      totalUsers,
      pendingUsers,
      approvedUsers,
      totalWorkspaces,
      totalRequests,
    });
  } catch (error) {
    console.error("GET /api/admin/stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
