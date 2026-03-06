import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tokens = await prisma.proxyToken.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        token: true,
        isActive: true,
        lastUsed: true,
        createdAt: true,
      },
    });

    // Mask tokens except last 8 chars
    const masked = tokens.map((t) => ({
      ...t,
      token: "vly_" + "*".repeat(24) + t.token.slice(-8),
      fullToken: undefined,
    }));

    return NextResponse.json(masked);
  } catch (error) {
    console.error("GET /api/proxy-tokens error:", error);
    return NextResponse.json({ error: "Failed to fetch tokens" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await req.json();
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const token = "vly_" + crypto.randomBytes(32).toString("hex");

    const created = await prisma.proxyToken.create({
      data: {
        name: name.trim(),
        token,
        userId: session.user.id,
      },
    });

    // Return full token only on creation
    return NextResponse.json({
      id: created.id,
      name: created.name,
      token,
      isActive: created.isActive,
      createdAt: created.createdAt,
    });
  } catch (error) {
    console.error("POST /api/proxy-tokens error:", error);
    return NextResponse.json({ error: "Failed to create token" }, { status: 500 });
  }
}
