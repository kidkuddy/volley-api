import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const proxyToken = await prisma.proxyToken.findUnique({ where: { token } });
    if (!proxyToken || !proxyToken.isActive) {
      return NextResponse.json({ error: "Invalid or inactive token" }, { status: 401 });
    }

    // Update last used
    await prisma.proxyToken.update({
      where: { id: proxyToken.id },
      data: { lastUsed: new Date() },
    });

    // Get pending requests
    const pending = await prisma.proxyRequest.findMany({
      where: { tokenId: proxyToken.id, status: "pending" },
      orderBy: { createdAt: "asc" },
      take: 10,
    });

    return NextResponse.json({ requests: pending });
  } catch (error) {
    console.error("GET /api/proxy-relay/poll error:", error);
    return NextResponse.json({ error: "Poll failed" }, { status: 500 });
  }
}
