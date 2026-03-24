const fs = require("fs");
const path = require("path");
const http = require("http");
const { URL } = require("url");
const querystring = require("querystring");

const HOST = "0.0.0.0";
const PORT = Number(process.env.PORT || 8080);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const INQUIRIES_FILE = path.join(DATA_DIR, "inquiries.ndjson");
const MAX_BODY_SIZE = 1024 * 1024;

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".svg": "image/svg+xml; charset=utf-8",
  ".ico": "image/x-icon"
};

const ensureDataStorage = () => {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(INQUIRIES_FILE)) {
    fs.writeFileSync(INQUIRIES_FILE, "");
  }
};

const normalizeText = (value, maxLength = 5000) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const readRequestBody = (req) =>
  new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];

    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_SIZE) {
        reject(new Error("Payload too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
    req.on("error", reject);
  });

const json = (res, statusCode, data) => {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
};

const parsePayload = (req, rawBody) => {
  const contentType = req.headers["content-type"] || "";

  if (contentType.includes("application/json")) {
    return JSON.parse(rawBody || "{}");
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    return querystring.parse(rawBody);
  }

  return {};
};

const createRecord = (payload, req) => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  submittedAt: new Date().toISOString(),
  source: normalizeText(payload.source, 64) || "site",
  name: normalizeText(payload.name, 120),
  partnerName: normalizeText(payload.partnerName, 120),
  email: normalizeText(payload.email, 180),
  phone: normalizeText(payload.phone, 60),
  serviceType: normalizeText(payload.serviceType, 80),
  eventDate: normalizeText(payload.eventDate, 32),
  location: normalizeText(payload.location, 180),
  packageType: normalizeText(payload.packageType, 80),
  budget: normalizeText(payload.budget, 80),
  message: normalizeText(payload.message, 3000),
  userAgent: normalizeText(req.headers["user-agent"], 400),
  remoteAddress: normalizeText(req.socket.remoteAddress, 80)
});

const sendNotificationEmail = async (record) => {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  
  if (!RESEND_API_KEY) {
    console.log(`[EMAIL] Simulação (Falta RESEND_API_KEY): Novo pedido de ${record.name}`);
    return;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Famorfotografia <onboarding@resend.dev>',
        to: ['famorfotografia@gmail.com'], // Substitui pelo teu email de destino
        subject: `Novo Pedido: ${record.name} - ${record.serviceType}`,
        html: `
          <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
            <h2>Novo Pedido de Reserva!</h2>
            <p><strong>Cliente:</strong> ${record.name} ${record.partnerName ? `& ${record.partnerName}` : ''}</p>
            <p><strong>Serviço:</strong> ${record.serviceType}</p>
            <p><strong>Pacote:</strong> ${record.packageType || 'Não selecionado'}</p>
            <p><strong>Data do Evento:</strong> ${record.eventDate}</p>
            <p><strong>Local:</strong> ${record.location || 'Não especificado'}</p>
            <p><strong>Email:</strong> ${record.email}</p>
            <p><strong>Telefone:</strong> ${record.phone || 'Não facultado'}</p>
            <p><strong>Orçamento:</strong> ${record.budget || 'Não indicado'}</p>
            <hr>
            <p><strong>Mensagem:</strong><br>${record.message.replace(/\n/g, '<br>')}</p>
            <br>
            <small style="color: #999;">Enviado via Famorfotografia WebServer</small>
          </div>
        `
      }),
    });

    const data = await response.json();
    if (response.ok) {
      console.log(`[EMAIL] Notificação enviada com sucesso: ${data.id}`);
    } else {
      console.error('[EMAIL] Erro na API Resend:', data);
    }
  } catch (err) {
    console.error('[EMAIL] Erro fatal no envio:', err);
  }
};

const handleInquiry = async (req, res) => {
  try {
    const rawBody = await readRequestBody(req);
    const payload = parsePayload(req, rawBody);

    if (payload.website) {
      json(res, 201, { ok: true });
      return;
    }

    const name = normalizeText(payload.name, 120);
    const email = normalizeText(payload.email, 180);
    const eventDate = normalizeText(payload.eventDate, 32);

    if (!name || !email || !eventDate) {
      json(res, 400, { error: "Missing required fields." });
      return;
    }

    if (!isEmail(email)) {
      json(res, 400, { error: "Invalid email." });
      return;
    }

    const record = createRecord(payload, req);
    fs.appendFileSync(INQUIRIES_FILE, `${JSON.stringify(record)}\n`);
    
    // Enviar notificação
    sendNotificationEmail(record).catch(err => console.error("Email error:", err));

    json(res, 201, { ok: true, id: record.id });
  } catch (error) {
    if (error instanceof SyntaxError) {
      json(res, 400, { error: "Invalid payload." });
      return;
    }
    if (error.message === "Payload too large") {
      json(res, 413, { error: "Payload too large." });
      return;
    }
    json(res, 500, { error: "Server error." });
  }
};

const safePathFromUrl = (requestUrl) => {
  const url = new URL(requestUrl, `http://${HOST}:${PORT}`);
  const decodedPath = decodeURIComponent(url.pathname);
  const cleanPath = decodedPath === "/" ? "/index.html" : decodedPath;
  const absolutePath = path.join(ROOT, cleanPath);
  const normalized = path.normalize(absolutePath);

  if (!normalized.startsWith(ROOT)) {
    return null;
  }

  return normalized;
};

const serveStatic = (req, res) => {
  const filePath = safePathFromUrl(req.url || "/");

  if (!filePath) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = CONTENT_TYPES[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    fs.createReadStream(filePath).pipe(res);
  });
};

ensureDataStorage();

const ADMIN_PASSWORD = "famor2026";

const handleAdminInquiries = (req, res) => {
  const auth = req.headers["authorization"];
  if (auth !== ADMIN_PASSWORD) {
    json(res, 401, { error: "Unauthorized" });
    return;
  }

  if (!fs.existsSync(INQUIRIES_FILE)) {
    json(res, 200, []);
    return;
  }

  try {
    const content = fs.readFileSync(INQUIRIES_FILE, "utf8");
    const lines = content.trim().split("\n").filter(Boolean).map(JSON.parse);
    json(res, 200, lines);
  } catch (error) {
    json(res, 500, { error: "Error reading inquiries." });
  }
};

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/api/inquiry") {
    handleInquiry(req, res);
    return;
  }

  if (req.method === "GET" && req.url === "/api/admin/inquiries") {
    handleAdminInquiries(req, res);
    return;
  }

  if (req.method === "GET" || req.method === "HEAD") {
    serveStatic(req, res);
    return;
  }

  res.writeHead(405);
  res.end("Method Not Allowed");
});

server.listen(PORT, HOST, () => {
  console.log(`Famor site running at http://${HOST}:${PORT}`);
  console.log(`Inquiries file: ${INQUIRIES_FILE}`);
});
