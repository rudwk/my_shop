import http from "node:http";
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT ?? 5173);
const API_TARGET = process.env.API_TARGET ?? "http://localhost:3000";

const publicDir = path.join(__dirname, "public");

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".ico", "image/x-icon"],
]);

function safeJoin(baseDir, requestPath) {
  const relative = requestPath.replace(/^[/\\]+/, "");
  const resolved = path.resolve(baseDir, relative);
  const relToBase = path.relative(baseDir, resolved);
  if (relToBase.startsWith("..") || path.isAbsolute(relToBase)) {
    return baseDir;
  }
  return resolved;
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function proxyToBackend(req, res) {
  const targetUrl = new URL(API_TARGET);
  const targetIsHttps = targetUrl.protocol === "https:";

  const upstreamPath = req.url === "/api" ? "/" : req.url.slice(4);
  const upstreamUrl = new URL(upstreamPath || "/", targetUrl);

  const requestOptions = {
    protocol: upstreamUrl.protocol,
    hostname: upstreamUrl.hostname,
    port: upstreamUrl.port || (targetIsHttps ? 443 : 80),
    method: req.method,
    path: upstreamUrl.pathname + upstreamUrl.search,
    headers: {
      ...req.headers,
      host: targetUrl.host,
    },
  };

  const upstreamReq = (targetIsHttps ? https : http).request(
    requestOptions,
    (upstreamRes) => {
      const headers = { ...upstreamRes.headers };
      // Avoid leaking hop-by-hop headers.
      delete headers.connection;
      delete headers["keep-alive"];
      delete headers["transfer-encoding"];
      delete headers.upgrade;

      res.writeHead(upstreamRes.statusCode ?? 502, headers);
      upstreamRes.pipe(res);
    },
  );

  upstreamReq.on("error", (error) => {
    sendJson(res, 502, {
      message: "Bad Gateway",
      detail: error?.message ?? String(error),
    });
  });

  req.pipe(upstreamReq);
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = decodeURIComponent(url.pathname);

  // SPA routes should fall back to index.html.
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const filePath = safeJoin(publicDir, requestedPath);

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = mimeTypes.get(ext) ?? "application/octet-stream";
      res.writeHead(200, { "Content-Type": contentType });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    // Fallback to index.html for client-side routing.
    const indexPath = path.join(publicDir, "index.html");
    fs.stat(indexPath, (indexErr, indexStat) => {
      if (indexErr || !indexStat.isFile()) {
        sendJson(res, 500, { message: "Missing public/index.html" });
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      fs.createReadStream(indexPath).pipe(res);
    });
  });
}

const server = http.createServer((req, res) => {
  if (req.url?.startsWith("/api/") || req.url === "/api") {
    proxyToBackend(req, res);
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`[frontend] http://localhost:${PORT}`);
  console.log(`[frontend] proxy /api -> ${API_TARGET}`);
});
