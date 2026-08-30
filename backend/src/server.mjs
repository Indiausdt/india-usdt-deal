import crypto from "node:crypto";
import fs from "node:fs/promises";
import http from "node:http";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import pg from "pg";
import { WebSocketServer } from "ws";

const { Pool } = pg;
const required = ["DATABASE_URL", "JWT_SECRET"];
for (const key of required) {
  if (!process.env[key]) throw new Error(`${key} is required`);
}
if (process.env.JWT_SECRET.length < 32)
  throw new Error("JWT_SECRET must contain at least 32 characters");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});
const app = express();
const server = http.createServer(app);
const sockets = new Map();
const maxUploadBytes = Number(process.env.UPLOAD_MAX_BYTES || 5_242_880);

app.disable("x-powered-by");
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN
      ? process.env.FRONTEND_ORIGIN.split(",").map((v) => v.trim())
      : false,
    credentials: false,
  }),
);
app.use(express.json({ limit: "1mb" }));

const id = () => crypto.randomUUID();
const b64url = (value) => Buffer.from(value).toString("base64url");
const signToken = (account) => {
  const payload = b64url(
    JSON.stringify({
      sub: account.id,
      role: account.role,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12,
    }),
  );
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const signature = crypto
    .createHmac("sha256", process.env.JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${signature}`;
};
const verifyToken = (token) => {
  const [header, payload, signature] = String(token || "").split(".");
  if (!header || !payload || !signature) throw new Error("Invalid token");
  const expected = crypto
    .createHmac("sha256", process.env.JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest();
  const supplied = Buffer.from(signature, "base64url");
  if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied))
    throw new Error("Invalid token");
  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString());
  if (!parsed.exp || parsed.exp < Date.now() / 1000) throw new Error("Expired token");
  return parsed;
};
const hashPassword = (password, salt = crypto.randomBytes(16).toString("hex")) => {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
};
const verifyPassword = (password, stored) => {
  const [salt, expectedHex] = String(stored || "").split(":");
  if (!salt || !expectedHex) return false;
  const actual = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
};
const auth = (...roles) => async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    const claims = verifyToken(token);
    const { rows } = await pool.query(
      "SELECT id, role, display_name, blocked FROM accounts WHERE id=$1",
      [claims.sub],
    );
    const account = rows[0];
    if (!account || account.blocked) return res.status(403).json({ error: "Account unavailable" });
    if (roles.length && !roles.includes(account.role))
      return res.status(403).json({ error: "Not permitted" });
    req.account = account;
    next();
  } catch {
    res.status(401).json({ error: "Authentication required" });
  }
};
const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const orderForParticipant = async (orderId, accountId) => {
  const { rows } = await pool.query(
    "SELECT * FROM trade_orders WHERE id=$1 AND (user_id=$2 OR agent_id=$2)",
    [orderId, accountId],
  );
  return rows[0];
};
const sendTo = (accountId, event) => {
  for (const socket of sockets.get(accountId) || []) {
    if (socket.readyState === 1) socket.send(JSON.stringify(event));
  }
};

app.get("/health", asyncRoute(async (_req, res) => {
  await pool.query("SELECT 1");
  res.json({ ok: true, service: "india-usdt-deal-api" });
}));

app.post("/auth/login", asyncRoute(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const { rows } = await pool.query("SELECT * FROM accounts WHERE email=$1", [email]);
  const account = rows[0];
  if (!account || !verifyPassword(password, account.password_hash) || account.blocked)
    return res.status(401).json({ error: "Invalid login" });
  res.json({ token: signToken(account), account: publicAccount(account) });
}));

app.post("/auth/telegram", asyncRoute(async (req, res) => {
  if (!process.env.TELEGRAM_BOT_TOKEN)
    return res.status(503).json({ error: "Telegram login is not configured" });
  const data = new URLSearchParams(String(req.body.initData || ""));
  const receivedHash = data.get("hash");
  data.delete("hash");
  const authDate = Number(data.get("auth_date"));
  if (!receivedHash || !authDate || Date.now() / 1000 - authDate > 600)
    return res.status(401).json({ error: "Telegram session expired" });
  const check = [...data.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k,v]) => `${k}=${v}`).join("\n");
  const secret = crypto.createHmac("sha256", "WebAppData").update(process.env.TELEGRAM_BOT_TOKEN).digest();
  const calculated = crypto.createHmac("sha256", secret).update(check).digest("hex");
  const received = Buffer.from(receivedHash, "hex");
  const calculatedBuffer = Buffer.from(calculated, "hex");
  if (received.length !== calculatedBuffer.length || !crypto.timingSafeEqual(received, calculatedBuffer))
    return res.status(401).json({ error: "Invalid Telegram signature" });
  const user = JSON.parse(data.get("user") || "{}");
  if (!user.id) return res.status(400).json({ error: "Telegram user missing" });
  const displayName = [user.first_name, user.last_name].filter(Boolean).join(" ");
  const accountId = id();
  const { rows } = await pool.query(
    `INSERT INTO accounts(id,role,telegram_id,display_name,avatar_url,last_seen_at)
     VALUES($1,'user',$2,$3,$4,NOW())
     ON CONFLICT(telegram_id) DO UPDATE SET display_name=EXCLUDED.display_name,
       avatar_url=COALESCE(EXCLUDED.avatar_url,accounts.avatar_url),last_seen_at=NOW(),updated_at=NOW()
     RETURNING *`,
    [accountId, user.id, displayName, user.photo_url || null],
  );
  if (rows[0].blocked) return res.status(403).json({ error: "Account blocked" });
  res.json({ token: signToken(rows[0]), account: publicAccount(rows[0]) });
}));

app.get("/me", auth(), asyncRoute(async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM accounts WHERE id=$1", [req.account.id]);
  res.json(publicAccount(rows[0]));
}));

app.patch("/me", auth(), asyncRoute(async (req, res) => {
  const name = String(req.body.displayName || "").trim().slice(0, 60);
  const mobile = String(req.body.mobileNumber || "").replace(/\D/g, "");
  if (!name) return res.status(400).json({ error: "Display name is required" });
  if (mobile && !/^\d{10}$/.test(mobile))
    return res.status(400).json({ error: "Enter a valid 10-digit mobile number" });
  const { rows } = await pool.query(
    "UPDATE accounts SET display_name=$1,mobile_number=$2,updated_at=NOW() WHERE id=$3 RETURNING *",
    [name, mobile || null, req.account.id],
  );
  res.json(publicAccount(rows[0]));
}));

app.get("/offers", asyncRoute(async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT o.id,o.payment_method AS "paymentMethod",o.rate,o.min_inr AS "minInr",
      o.max_inr AS "maxInr",o.available_usdt AS "availableUsdt",a.id AS "agentId",
      a.display_name AS "agentName",a.avatar_url AS "agentAvatar",a.completed_trades AS "trades",
      a.success_rate AS "successRate",a.last_seen_at AS "lastSeenAt"
     FROM offers o JOIN accounts a ON a.id=o.agent_id
     WHERE o.active=TRUE AND a.blocked=FALSE ORDER BY o.created_at DESC`,
  );
  res.json(rows);
}));

app.post("/agent/offers", auth("agent"), asyncRoute(async (req, res) => {
  const method = String(req.body.paymentMethod || "");
  const rate = Number(req.body.rate), min = Number(req.body.minInr), max = Number(req.body.maxInr);
  if (!['ATM QR','YONO Cash'].includes(method) || rate <= 0 || min <= 0 || max < min)
    return res.status(400).json({ error: "Invalid offer details" });
  const offerId = id();
  const { rows } = await pool.query(
    `INSERT INTO offers(id,agent_id,payment_method,rate,min_inr,max_inr,available_usdt)
     VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [offerId, req.account.id, method, rate, min, max, Number(req.body.availableUsdt || 0)],
  );
  res.status(201).json(rows[0]);
}));

app.patch("/agent/profile", auth("agent"), asyncRoute(async (req, res) => {
  const { rows } = await pool.query(
    `UPDATE accounts SET display_name=$1,completed_trades=$2,success_rate=$3,
      avatar_url=COALESCE($4,avatar_url),updated_at=NOW() WHERE id=$5 RETURNING *`,
    [String(req.body.displayName || "Agent").slice(0,60), Number(req.body.completedTrades || 0),
      Math.min(100, Math.max(0, Number(req.body.successRate || 0))), req.body.avatarUrl || null, req.account.id],
  );
  res.json(publicAccount(rows[0]));
}));

app.post("/orders", auth("user"), asyncRoute(async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `SELECT o.*,a.blocked AS agent_blocked FROM offers o JOIN accounts a ON a.id=o.agent_id
       WHERE o.id=$1 AND o.active=TRUE FOR UPDATE`, [req.body.offerId],
    );
    const offer = rows[0], amount = Number(req.body.amountInr);
    if (!offer || offer.agent_blocked || amount < Number(offer.min_inr) || amount > Number(offer.max_inr))
      throw Object.assign(new Error("Offer unavailable or amount outside limits"), { status: 400 });
    const blocked = await client.query("SELECT 1 FROM user_blocks WHERE agent_id=$1 AND user_id=$2", [offer.agent_id, req.account.id]);
    if (blocked.rowCount) throw Object.assign(new Error("You cannot order from this agent"), { status: 403 });
    const orderId = id(), usdt = amount / Number(offer.rate);
    const inserted = await client.query(
      `INSERT INTO trade_orders(id,offer_id,user_id,agent_id,payment_method,amount_inr,rate,amount_usdt)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [orderId, offer.id, req.account.id, offer.agent_id, offer.payment_method, amount, offer.rate, usdt],
    );
    await client.query("COMMIT");
    sendTo(offer.agent_id, { type: "order.created", order: inserted.rows[0] });
    res.status(201).json(inserted.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }
}));

app.get("/orders", auth(), asyncRoute(async (req, res) => {
  const column = req.account.role === "agent" ? "agent_id" : "user_id";
  if (req.account.role === "admin") {
    const { rows } = await pool.query("SELECT * FROM trade_orders ORDER BY created_at DESC LIMIT 250");
    return res.json(rows);
  }
  const { rows } = await pool.query(`SELECT * FROM trade_orders WHERE ${column}=$1 ORDER BY created_at DESC`, [req.account.id]);
  res.json(rows);
}));

app.post("/orders/:id/cancel", auth("user","agent","admin"), asyncRoute(async (req, res) => {
  const order = req.account.role === "admin"
    ? (await pool.query("SELECT * FROM trade_orders WHERE id=$1", [req.params.id])).rows[0]
    : await orderForParticipant(req.params.id, req.account.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  const { rows } = await pool.query(
    `UPDATE trade_orders SET status='cancelled',cancelled_by=$1,closed_at=NOW(),updated_at=NOW()
     WHERE id=$2 AND status='active' RETURNING *`, [req.account.id, order.id],
  );
  if (!rows[0]) return res.status(409).json({ error: "Order is not active" });
  sendTo(order.user_id, { type: "order.updated", order: rows[0] });
  sendTo(order.agent_id, { type: "order.updated", order: rows[0] });
  res.json(rows[0]);
}));

app.post("/orders/:id/restore", auth("agent","admin"), asyncRoute(async (req, res) => {
  const { rows } = await pool.query(
    `UPDATE trade_orders SET status='active',cancelled_by=NULL,closed_at=NULL,updated_at=NOW()
     WHERE id=$1 AND status='cancelled' AND ($2='admin' OR agent_id=$3) RETURNING *`,
    [req.params.id, req.account.role, req.account.id],
  );
  if (!rows[0]) return res.status(404).json({ error: "Cancelled order not found" });
  sendTo(rows[0].user_id, { type: "order.updated", order: rows[0] });
  res.json(rows[0]);
}));

app.post("/orders/:id/block-user", auth("agent"), asyncRoute(async (req, res) => {
  const order = await orderForParticipant(req.params.id, req.account.id);
  if (!order || order.agent_id !== req.account.id) return res.status(404).json({ error: "Order not found" });
  await pool.query("INSERT INTO user_blocks(agent_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING", [req.account.id, order.user_id]);
  res.json({ blocked: true });
}));

app.delete("/orders/:id/block-user", auth("agent"), asyncRoute(async (req, res) => {
  const order = await orderForParticipant(req.params.id, req.account.id);
  if (!order || order.agent_id !== req.account.id) return res.status(404).json({ error: "Order not found" });
  await pool.query("DELETE FROM user_blocks WHERE agent_id=$1 AND user_id=$2", [req.account.id, order.user_id]);
  res.json({ blocked: false });
}));

app.get("/orders/:id/messages", auth(), asyncRoute(async (req, res) => {
  const order = req.account.role === "admin" ? true : await orderForParticipant(req.params.id, req.account.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  const { rows } = await pool.query(
    `SELECT id,order_id AS "orderId",sender_id AS "senderId",kind,body,image_id AS "imageId",
      status,created_at AS "createdAt",delivered_at AS "deliveredAt",seen_at AS "seenAt"
     FROM messages WHERE order_id=$1 ORDER BY created_at`, [req.params.id],
  );
  res.json(rows);
}));

app.post("/orders/:id/messages", auth("user","agent"), asyncRoute(async (req, res) => {
  const order = await orderForParticipant(req.params.id, req.account.id);
  if (!order || order.status !== "active") return res.status(409).json({ error: "Active order not found" });
  const body = String(req.body.body || "").trim().slice(0, 4000);
  const imageId = req.body.imageId || null;
  if (!body && !imageId) return res.status(400).json({ error: "Message is empty" });
  const recipientId = order.user_id === req.account.id ? order.agent_id : order.user_id;
  const online = (sockets.get(recipientId)?.size || 0) > 0;
  const messageId = id();
  const { rows } = await pool.query(
    `INSERT INTO messages(id,order_id,sender_id,kind,body,image_id,status,delivered_at)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [messageId, order.id, req.account.id, imageId ? "image" : "text", body || null, imageId,
      online ? "delivered" : "sent", online ? new Date() : null],
  );
  sendTo(recipientId, { type: "message.created", message: rows[0] });
  res.status(201).json(rows[0]);
}));

app.post("/orders/:id/seen", auth("user","agent"), asyncRoute(async (req, res) => {
  const order = await orderForParticipant(req.params.id, req.account.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  const { rows } = await pool.query(
    `UPDATE messages SET status='seen',delivered_at=COALESCE(delivered_at,NOW()),seen_at=NOW()
     WHERE order_id=$1 AND sender_id<>$2 AND status<>'seen' RETURNING sender_id`,
    [order.id, req.account.id],
  );
  for (const row of rows) sendTo(row.sender_id, { type: "messages.seen", orderId: order.id });
  res.json({ seen: rows.length });
}));

app.post("/uploads", auth("user","agent","admin"), express.raw({ type: ["image/jpeg","image/png","image/webp"], limit: maxUploadBytes }), asyncRoute(async (req, res) => {
  if (!Buffer.isBuffer(req.body) || !req.body.length) return res.status(400).json({ error: "Image required" });
  const uploadId = id();
  await pool.query("INSERT INTO uploads(id,owner_id,mime_type,size_bytes,content) VALUES($1,$2,$3,$4,$5)",
    [uploadId, req.account.id, req.headers["content-type"], req.body.length, req.body]);
  res.status(201).json({ id: uploadId, url: `/uploads/${uploadId}` });
}));

app.get("/uploads/:id", asyncRoute(async (req, res) => {
  const { rows } = await pool.query("SELECT mime_type,content FROM uploads WHERE id=$1", [req.params.id]);
  if (!rows[0]) return res.status(404).end();
  res.set("Content-Type", rows[0].mime_type).set("Cache-Control", "private,max-age=86400").send(rows[0].content);
}));

const telegramApi = async (method, payload) => {
  if (!process.env.TELEGRAM_BOT_TOKEN) return null;
  const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!result.ok) throw new Error(`Telegram ${method} failed: ${result.description || response.status}`);
  return result.result;
};

app.post("/telegram/webhook", asyncRoute(async (req, res) => {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expected && req.headers["x-telegram-bot-api-secret-token"] !== expected)
    return res.status(403).json({ error: "Invalid Telegram webhook" });
  const message = req.body?.message;
  if (!message?.chat?.id) return res.json({ ok: true });
  const command = String(message.text || "").split(/\s+/)[0].toLowerCase();
  if (command === "/start") {
    await telegramApi("sendMessage", {
      chat_id: message.chat.id,
      text: "Welcome to India USDT Deal 🇮🇳\n\nBuy or sell USDT with verified P2P agents. Tap the button below to open the secure Mini App.",
      reply_markup: {
        inline_keyboard: [[{
          text: "🚀 Open India USDT Deal",
          web_app: { url: process.env.FRONTEND_ORIGIN },
        }]],
      },
    });
  }
  res.json({ ok: true });
}));

app.get("/admin/agents", auth("admin"), asyncRoute(async (_req, res) => {
  const { rows } = await pool.query("SELECT * FROM accounts WHERE role='agent' ORDER BY created_at DESC");
  res.json(rows.map(publicAccount));
}));

app.post("/admin/agents", auth("admin"), asyncRoute(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (!email || password.length < 8) return res.status(400).json({ error: "Valid email and 8+ character password required" });
  const { rows } = await pool.query(
    `INSERT INTO accounts(id,role,email,password_hash,display_name,verified)
     VALUES($1,'agent',$2,$3,$4,TRUE) RETURNING *`,
    [id(), email, hashPassword(password), String(req.body.displayName || "Agent").slice(0,60)],
  );
  res.status(201).json(publicAccount(rows[0]));
}));

app.post("/admin/agents/:id/block", auth("admin"), asyncRoute(async (req, res) => {
  const blocked = req.body.blocked !== false;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query("UPDATE accounts SET blocked=$1,updated_at=NOW() WHERE id=$2 AND role='agent' RETURNING *", [blocked, req.params.id]);
    if (!rows[0]) throw Object.assign(new Error("Agent not found"), { status: 404 });
    await client.query("UPDATE offers SET active=FALSE,updated_at=NOW() WHERE agent_id=$1", [req.params.id]);
    await client.query("COMMIT");
    for (const socket of sockets.get(req.params.id) || []) socket.close(4003, "Account blocked");
    res.json(publicAccount(rows[0]));
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}));

const wss = new WebSocketServer({ server, path: "/realtime" });
wss.on("connection", async (socket, request) => {
  try {
    const url = new URL(request.url, "http://localhost");
    const claims = verifyToken(url.searchParams.get("token"));
    const accountId = claims.sub;
    if (!sockets.has(accountId)) sockets.set(accountId, new Set());
    sockets.get(accountId).add(socket);
    await pool.query("UPDATE accounts SET last_seen_at=NOW() WHERE id=$1", [accountId]);
    const delivered = await pool.query(
      `UPDATE messages m SET status='delivered',delivered_at=NOW()
       FROM trade_orders o WHERE m.order_id=o.id AND m.sender_id<>$1 AND m.status='sent'
       AND (o.user_id=$1 OR o.agent_id=$1) RETURNING m.sender_id,m.order_id`, [accountId],
    );
    for (const row of delivered.rows) sendTo(row.sender_id, { type: "messages.delivered", orderId: row.order_id });
    socket.send(JSON.stringify({ type: "realtime.ready" }));
    socket.on("close", () => {
      sockets.get(accountId)?.delete(socket);
      if (!sockets.get(accountId)?.size) sockets.delete(accountId);
    });
  } catch { socket.close(4001, "Authentication required"); }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json({ error: error.status ? error.message : "Server error" });
});

function publicAccount(account) {
  return {
    id: account.id,
    role: account.role,
    displayName: account.display_name,
    mobileNumber: account.mobile_number,
    avatarUrl: account.avatar_url,
    completedTrades: account.completed_trades,
    successRate: account.success_rate,
    verified: account.verified,
    blocked: account.blocked,
    lastSeenAt: account.last_seen_at,
  };
}

async function initialize() {
  const schemaPath = fileURLToPath(new URL("./schema.sql", import.meta.url));
  await pool.query(await fs.readFile(schemaPath, "utf8"));
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    await pool.query(
      `INSERT INTO accounts(id,role,email,password_hash,display_name,verified)
       VALUES($1,'admin',$2,$3,'Administrator',TRUE) ON CONFLICT(email) DO NOTHING`,
      [id(), process.env.ADMIN_EMAIL.trim().toLowerCase(), hashPassword(process.env.ADMIN_PASSWORD)],
    );
  }
  const cleanup = async () => {
    await pool.query(`DELETE FROM trade_orders WHERE closed_at < NOW() - INTERVAL '15 days'`);
    await pool.query(`DELETE FROM uploads u WHERE NOT EXISTS (
      SELECT 1 FROM messages m WHERE m.image_id=u.id
    ) AND u.created_at < NOW() - INTERVAL '15 days'`);
  };
  await cleanup();
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.BACKEND_PUBLIC_URL) {
    const webhookUrl = `${process.env.BACKEND_PUBLIC_URL.replace(/\/$/, "")}/telegram/webhook`;
    await telegramApi("setWebhook", {
      url: webhookUrl,
      secret_token: process.env.TELEGRAM_WEBHOOK_SECRET || undefined,
      allowed_updates: ["message"],
      drop_pending_updates: true,
    });
    await telegramApi("setMyCommands", {
      commands: [{ command: "start", description: "Open India USDT Deal" }],
    });
    console.log(`Telegram webhook configured at ${webhookUrl}`);
  }
  setInterval(() => cleanup().catch(console.error), 3_600_000).unref();
  server.listen(Number(process.env.PORT || 8080), "0.0.0.0", () =>
    console.log(`API listening on port ${process.env.PORT || 8080}`),
  );
}

initialize().catch((error) => {
  console.error(error);
  process.exit(1);
});
