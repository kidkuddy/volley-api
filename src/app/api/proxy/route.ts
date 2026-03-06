import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url, method, headers, body, queryParams, proxyTokenId } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Check if this is a localhost URL and proxyTokenId is provided
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?/i.test(url);

    if (isLocalhost && proxyTokenId) {
      // Route through the relay — create a pending proxy request
      const token = await prisma.proxyToken.findUnique({ where: { id: proxyTokenId } });
      if (!token || token.userId !== session.user.id || !token.isActive) {
        return NextResponse.json({
          status: 0,
          statusText: "Error",
          headers: {},
          body: "Invalid or inactive proxy token. Make sure the CLI is running.",
          time: 0,
          size: 0,
        }, { status: 400 });
      }

      const proxyRequest = await prisma.proxyRequest.create({
        data: {
          tokenId: token.id,
          method: (method || "GET").toUpperCase(),
          url,
          headers: headers || {},
          queryParams: queryParams || {},
          bodyType: null,
          body: body || null,
        },
      });

      // Poll for response (max 30 seconds)
      const startTime = Date.now();
      const timeout = 30000;

      while (Date.now() - startTime < timeout) {
        const updated = await prisma.proxyRequest.findUnique({
          where: { id: proxyRequest.id },
        });

        if (updated?.status === "completed" && updated.response) {
          // Clean up
          await prisma.proxyRequest.delete({ where: { id: proxyRequest.id } });
          return NextResponse.json(updated.response);
        }

        // Wait 500ms before next poll
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Timeout — clean up
      await prisma.proxyRequest.delete({ where: { id: proxyRequest.id } });
      return NextResponse.json({
        status: 0,
        statusText: "Timeout",
        headers: {},
        body: "Request timed out. Make sure the Volley CLI is running and connected.",
        time: timeout,
        size: 0,
      });
    }

    // Direct proxy (non-localhost or no token)
    const targetUrl = new URL(url);
    if (queryParams && typeof queryParams === "object") {
      for (const [key, value] of Object.entries(queryParams)) {
        if (key) targetUrl.searchParams.append(key, (value as string) || "");
      }
    }

    const fetchHeaders: Record<string, string> = {};
    if (headers && typeof headers === "object") {
      for (const [key, value] of Object.entries(headers)) {
        if (key) fetchHeaders[key] = (value as string) || "";
      }
    }

    const httpMethod = (method || "GET").toUpperCase();
    const hasBody = !["GET", "HEAD"].includes(httpMethod);

    const startTime = performance.now();

    const response = await fetch(targetUrl.toString(), {
      method: httpMethod,
      headers: fetchHeaders,
      body: hasBody && body ? body : undefined,
    });

    const endTime = performance.now();
    const time = Math.round(endTime - startTime);

    const responseBody = await response.text();
    const size = new TextEncoder().encode(responseBody).length;

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
      time,
      size,
    });
  } catch (error) {
    console.error("POST /api/proxy error:", error);

    const message = error instanceof Error ? error.message : "Proxy request failed";
    return NextResponse.json(
      {
        status: 0,
        statusText: "Error",
        headers: {},
        body: message,
        time: 0,
        size: 0,
      },
      { status: 502 }
    );
  }
}
