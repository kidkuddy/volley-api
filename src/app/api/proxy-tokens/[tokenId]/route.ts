import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tokenId } = await params;
    const { isActive } = await req.json();

    const token = await prisma.proxyToken.findUnique({ where: { id: tokenId } });
    if (!token || token.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.proxyToken.update({
      where: { id: tokenId },
      data: { isActive },
    });

    return NextResponse.json({ id: updated.id, isActive: updated.isActive });
  } catch (error) {
    console.error("PATCH /api/proxy-tokens/[id] error:", error);
    return NextResponse.json({ error: "Failed to update token" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tokenId } = await params;

    const token = await prisma.proxyToken.findUnique({ where: { id: tokenId } });
    if (!token || token.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.proxyToken.delete({ where: { id: tokenId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/proxy-tokens/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete token" }, { status: 500 });
  }
}
