import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

interface OpenApiPath {
  [method: string]: {
    summary?: string;
    operationId?: string;
    tags?: string[];
    parameters?: Array<{
      name: string;
      in: string;
      required?: boolean;
      schema?: { type?: string };
    }>;
    requestBody?: {
      content?: {
        [contentType: string]: {
          schema?: unknown;
          example?: unknown;
        };
      };
    };
  };
}

interface OpenApiSpec {
  openapi?: string;
  swagger?: string;
  info?: { title?: string; version?: string };
  paths?: { [path: string]: OpenApiPath };
  servers?: Array<{ url: string }>;
  host?: string;
  basePath?: string;
  schemes?: string[];
}

const HTTP_METHODS = ["get", "post", "put", "patch", "delete", "head", "options"];

function parseSpec(raw: string): OpenApiSpec {
  // Try JSON first
  try {
    return JSON.parse(raw);
  } catch {
    // Try basic YAML parsing (handles most common cases)
    return parseSimpleYaml(raw);
  }
}

function parseSimpleYaml(yaml: string): OpenApiSpec {
  // Very basic YAML to JSON converter for OpenAPI specs
  // Handles the most common patterns
  try {
    const lines = yaml.split("\n");
    const result: Record<string, unknown> = {};
    const stack: Array<{ obj: Record<string, unknown>; indent: number }> = [{ obj: result, indent: -1 }];

    for (const line of lines) {
      if (!line.trim() || line.trim().startsWith("#")) continue;

      const indent = line.search(/\S/);
      const trimmed = line.trim();

      // Pop stack to find parent
      while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
        stack.pop();
      }

      const parent = stack[stack.length - 1].obj;

      if (trimmed.includes(":")) {
        const colonIdx = trimmed.indexOf(":");
        const key = trimmed.substring(0, colonIdx).trim().replace(/^["']|["']$/g, "");
        const valueStr = trimmed.substring(colonIdx + 1).trim();

        if (valueStr === "" || valueStr === "|" || valueStr === ">") {
          // Object or block scalar
          const newObj: Record<string, unknown> = {};
          parent[key] = newObj;
          stack.push({ obj: newObj, indent });
        } else if (valueStr.startsWith("[")) {
          // Inline array
          try {
            parent[key] = JSON.parse(valueStr.replace(/'/g, '"'));
          } catch {
            parent[key] = valueStr;
          }
        } else {
          // Simple value
          let val: string | number | boolean = valueStr.replace(/^["']|["']$/g, "");
          if (val === "true") val = true;
          else if (val === "false") val = false;
          else if (!isNaN(Number(val)) && val !== "") val = Number(val);
          parent[key] = val;
        }
      } else if (trimmed.startsWith("- ")) {
        // Array item — find the last key that should be an array
        const lastKey = Object.keys(parent).pop();
        if (lastKey) {
          if (!Array.isArray(parent[lastKey])) {
            parent[lastKey] = [];
          }
          const itemValue = trimmed.substring(2).trim();
          if (itemValue.includes(":")) {
            const itemObj: Record<string, unknown> = {};
            const parts = itemValue.split(":");
            itemObj[parts[0].trim()] = parts.slice(1).join(":").trim().replace(/^["']|["']$/g, "");
            (parent[lastKey] as unknown[]).push(itemObj);
          } else {
            (parent[lastKey] as unknown[]).push(itemValue.replace(/^["']|["']$/g, ""));
          }
        }
      }
    }

    return result as unknown as OpenApiSpec;
  } catch {
    throw new Error("Failed to parse YAML. Please use JSON format instead.");
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

    // Verify membership
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
    });

    if (!member || member.role !== "MANAGER") {
      return NextResponse.json({ error: "Only managers can import specs" }, { status: 403 });
    }

    const { spec: rawSpec } = await req.json();
    if (!rawSpec || typeof rawSpec !== "string") {
      return NextResponse.json({ error: "Spec content is required" }, { status: 400 });
    }

    const spec = parseSpec(rawSpec);

    if (!spec.paths || typeof spec.paths !== "object") {
      return NextResponse.json({ error: "No paths found in the spec" }, { status: 400 });
    }

    // Determine base URL
    let baseUrl = "";
    if (spec.servers && spec.servers.length > 0) {
      baseUrl = spec.servers[0].url;
    } else if (spec.host) {
      const scheme = spec.schemes?.[0] || "https";
      baseUrl = `${scheme}://${spec.host}${spec.basePath || ""}`;
    }

    // Group paths by first tag (or "Default" if no tag)
    const groups: Record<string, Array<{ path: string; method: string; operation: Record<string, unknown> }>> = {};

    for (const [path, methods] of Object.entries(spec.paths)) {
      for (const [method, operation] of Object.entries(methods as Record<string, Record<string, unknown>>)) {
        if (!HTTP_METHODS.includes(method.toLowerCase())) continue;

        const tags = (operation.tags as string[]) || ["Default"];
        const tag = tags[0] || "Default";

        if (!groups[tag]) groups[tag] = [];
        groups[tag].push({ path, method: method.toUpperCase(), operation });
      }
    }

    let foldersCreated = 0;
    let requestsCreated = 0;

    // Create folders and requests
    for (const [tag, endpoints] of Object.entries(groups)) {
      const folder = await prisma.folder.create({
        data: {
          name: tag,
          workspaceId,
          sortOrder: foldersCreated,
        },
      });
      foldersCreated++;

      for (const endpoint of endpoints) {
        const name = (endpoint.operation.summary as string) ||
          (endpoint.operation.operationId as string) ||
          `${endpoint.method} ${endpoint.path}`;

        const url = baseUrl ? `${baseUrl}${endpoint.path}` : endpoint.path;

        // Extract query params
        const queryParams = ((endpoint.operation.parameters as Array<{ name: string; in: string; required?: boolean }>) || [])
          .filter((p) => p.in === "query")
          .map((p) => ({
            id: crypto.randomUUID(),
            key: p.name,
            value: "",
            enabled: p.required ?? false,
          }));

        // Extract headers
        const headerParams = ((endpoint.operation.parameters as Array<{ name: string; in: string }>) || [])
          .filter((p) => p.in === "header")
          .map((p) => ({
            id: crypto.randomUUID(),
            key: p.name,
            value: "",
            enabled: true,
          }));

        // Determine body type
        let bodyType: string | null = null;
        let body: string | null = null;
        const requestBody = endpoint.operation.requestBody as { content?: Record<string, { example?: unknown; schema?: unknown }> } | undefined;
        if (requestBody?.content) {
          if (requestBody.content["application/json"]) {
            bodyType = "json";
            const example = requestBody.content["application/json"].example;
            if (example) {
              body = JSON.stringify(example, null, 2);
            }
          } else if (requestBody.content["application/x-www-form-urlencoded"]) {
            bodyType = "x-www-form-urlencoded";
          } else if (requestBody.content["multipart/form-data"]) {
            bodyType = "form-data";
          }
        }

        const validMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as const;
        type ValidMethod = typeof validMethods[number];
        const upperMethod = endpoint.method.toUpperCase();
        const resolvedMethod: ValidMethod = validMethods.includes(upperMethod as ValidMethod)
          ? (upperMethod as ValidMethod)
          : "GET";

        await prisma.request.create({
          data: {
            name,
            type: "HTTP",
            method: resolvedMethod,
            url,
            headers: headerParams,
            queryParams,
            bodyType,
            body,
            workspaceId,
            folderId: folder.id,
            sortOrder: requestsCreated,
          },
        });
        requestsCreated++;
      }
    }

    // Record the import
    const specHash = crypto.createHash("sha256").update(rawSpec).digest("hex");
    await prisma.openApiImport.create({
      data: {
        workspaceId,
        title: spec.info?.title || "Imported API",
        version: spec.info?.version || null,
        specHash,
      },
    });

    return NextResponse.json({
      foldersCreated,
      requestsCreated,
      title: spec.info?.title || "Imported API",
    });
  } catch (error) {
    console.error("POST /api/workspaces/[id]/import-openapi error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to import spec" },
      { status: 500 }
    );
  }
}
