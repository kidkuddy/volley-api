import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
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

    const { requestId, response } = await req.json();
    if (!requestId || !response) {
      return NextResponse.json({ error: "requestId and response are required" }, { status: 400 });
    }

    // Verify request belongs to this token
    const proxyRequest = await prisma.proxyRequest.findUnique({ where: { id: requestId } });
    if (!proxyRequest || proxyRequest.tokenId !== proxyToken.id) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    await prisma.proxyRequest.update({
      where: { id: requestId },
      data: { status: "completed", response },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/proxy-relay/respond error:", error);
    return NextResponse.json({ error: "Respond failed" }, { status: 500 });
  }
}
