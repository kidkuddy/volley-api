#!/usr/bin/env node

const DEFAULT_SERVER = "https://postmanclone-khaki.vercel.app";
const POLL_INTERVAL = 1500; // ms

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    token: "",
    port: 3000,
    host: "localhost",
    server: DEFAULT_SERVER,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--token":
      case "-t":
        config.token = args[++i] || "";
        break;
      case "--port":
      case "-p":
        config.port = parseInt(args[++i] || "3000", 10);
        break;
      case "--host":
      case "-h":
        if (args[i] === "-h" && (!args[i + 1] || args[i + 1].startsWith("-"))) {
          config.help = true;
        } else {
          config.host = args[++i] || "localhost";
        }
        break;
      case "--server":
      case "-s":
        config.server = args[++i] || DEFAULT_SERVER;
        break;
      case "--help":
        config.help = true;
        break;
    }
  }

  return config;
}

function printHelp() {
  console.log(`
  volley-proxy — Forward Volley requests to your localhost

  Usage:
    volley-proxy --token <token> [options]

  Options:
    -t, --token <token>   Proxy token from Volley (required)
    -p, --port <port>     Local port to forward to (default: 3000)
    -h, --host <host>     Local host (default: localhost)
    -s, --server <url>    Volley server URL (default: ${DEFAULT_SERVER})
        --help            Show this help message

  Examples:
    volley-proxy --token vly_abc123 --port 8080
    volley-proxy -t vly_abc123 -p 3000 -h 127.0.0.1
  `);
}

function log(msg, type = "info") {
  const time = new Date().toLocaleTimeString("en-US", { hour12: false });
  const colors = {
    info: "\x1b[36m",
    success: "\x1b[32m",
    error: "\x1b[31m",
    warn: "\x1b[33m",
    dim: "\x1b[90m",
  };
  const reset = "\x1b[0m";
  const color = colors[type] || colors.info;
  console.log(`${colors.dim}${time}${reset} ${color}${msg}${reset}`);
}

async function pollForRequests(config) {
  try {
    const res = await fetch(`${config.server}/api/proxy-relay/poll`, {
      headers: { Authorization: `Bearer ${config.token}` },
    });

    if (!res.ok) {
      if (res.status === 401) {
        log("Invalid or inactive token. Check your token and try again.", "error");
        process.exit(1);
      }
      return [];
    }

    const data = await res.json();
    return data.requests || [];
  } catch (err) {
    log(`Poll failed: ${err.message}`, "error");
    return [];
  }
}

async function executeRequest(config, proxyReq) {
  const method = proxyReq.method || "GET";
  const originalUrl = proxyReq.url;

  // Replace the host/port in the URL with the local target
  let targetUrl;
  try {
    const parsed = new URL(originalUrl);
    parsed.hostname = config.host;
    parsed.port = String(config.port);
    parsed.protocol = "http:";

    // Add query params
    if (proxyReq.queryParams && typeof proxyReq.queryParams === "object") {
      for (const [key, value] of Object.entries(proxyReq.queryParams)) {
        if (key) parsed.searchParams.append(key, value || "");
      }
    }

    targetUrl = parsed.toString();
  } catch {
    targetUrl = `http://${config.host}:${config.port}${originalUrl}`;
  }

  log(`${method} ${targetUrl}`, "dim");

  const startTime = performance.now();

  try {
    const headers = {};
    if (proxyReq.headers && typeof proxyReq.headers === "object") {
      for (const [key, value] of Object.entries(proxyReq.headers)) {
        if (key) headers[key] = value || "";
      }
    }

    const hasBody = !["GET", "HEAD"].includes(method);

    const response = await fetch(targetUrl, {
      method,
      headers,
      body: hasBody && proxyReq.body ? proxyReq.body : undefined,
    });

    const endTime = performance.now();
    const time = Math.round(endTime - startTime);

    const responseBody = await response.text();
    const size = new TextEncoder().encode(responseBody).length;

    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    const statusColor = response.status < 300 ? "success" : response.status < 500 ? "warn" : "error";
    log(`  -> ${response.status} ${response.statusText} (${time}ms, ${size}B)`, statusColor);

    return {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
      time,
      size,
    };
  } catch (err) {
    const endTime = performance.now();
    log(`  -> Error: ${err.message}`, "error");
    return {
      status: 0,
      statusText: "Error",
      headers: {},
      body: err.message,
      time: Math.round(endTime - startTime),
      size: 0,
    };
  }
}

async function sendResponse(config, requestId, response) {
  try {
    await fetch(`${config.server}/api/proxy-relay/respond`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ requestId, response }),
    });
  } catch (err) {
    log(`Failed to send response: ${err.message}`, "error");
  }
}

async function main() {
  const config = parseArgs();

  if (config.help) {
    printHelp();
    process.exit(0);
  }

  if (!config.token) {
    console.error("Error: --token is required\n");
    printHelp();
    process.exit(1);
  }

  console.log("");
  console.log("  \x1b[1m\x1b[38;2;255;107;53m⚡ Volley Proxy\x1b[0m");
  console.log("");
  console.log(`  Forwarding to \x1b[1mhttp://${config.host}:${config.port}\x1b[0m`);
  console.log(`  Server: \x1b[90m${config.server}\x1b[0m`);
  console.log(`  Token:  \x1b[90m${config.token.substring(0, 8)}...${config.token.slice(-4)}\x1b[0m`);
  console.log("");
  log("Listening for requests... (Ctrl+C to stop)", "info");
  console.log("");

  // Verify token on first poll
  const initial = await pollForRequests(config);
  if (initial.length > 0) {
    log(`Processing ${initial.length} pending request(s)`, "info");
  }

  // Main poll loop
  async function loop() {
    while (true) {
      const requests = await pollForRequests(config);

      for (const req of requests) {
        const response = await executeRequest(config, req);
        await sendResponse(config, req.id, response);
      }

      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
    }
  }

  loop().catch((err) => {
    log(`Fatal error: ${err.message}`, "error");
    process.exit(1);
  });
}

main();
