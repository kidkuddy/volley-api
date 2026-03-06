import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url, method, headers, body, queryParams } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Build the target URL with query params
    const targetUrl = new URL(url);
    if (queryParams && Array.isArray(queryParams)) {
      for (const param of queryParams) {
        if (param.enabled && param.key) {
          targetUrl.searchParams.append(param.key, param.value || "");
        }
      }
    }

    // Build headers object
    const fetchHeaders: Record<string, string> = {};
    if (headers && Array.isArray(headers)) {
      for (const header of headers) {
        if (header.enabled && header.key) {
          fetchHeaders[header.key] = header.value || "";
        }
      }
    }

    const httpMethod = (method || "GET").toUpperCase();
    const hasBody = !["GET", "HEAD"].includes(httpMethod);

    const startTime = performance.now();

    const response = await fetch(targetUrl.toString(), {
      method: httpMethod,
      headers: fetchHeaders,
      body: hasBody && body ? body : undefined,
      // @ts-ignore -- Allow self-signed certs in dev via Node.js fetch extension
      ...(process.env.NODE_ENV !== "production" && { rejectUnauthorized: false }),
    });

    const endTime = performance.now();
    const time = Math.round(endTime - startTime);

    const responseBody = await response.text();
    const size = new TextEncoder().encode(responseBody).length;

    // Collect response headers
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

    // Provide a useful error for connection failures (e.g., localhost not running)
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
