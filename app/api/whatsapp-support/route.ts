import { env } from "cloudflare:workers";

export const runtime = "edge";

async function ensureTable() {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS platform_settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  ).run();
}

function normalizeWhatsAppLink(input: string) {
  const value = input.trim();
  const digits = value.replace(/\D/g, "");
  if (/^\d{10}$/.test(value)) return `https://wa.me/91${value}`;
  if (/^\+?\d{11,15}$/.test(value)) return `https://wa.me/${digits}`;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (
      url.protocol === "https:" &&
      ["wa.me", "api.whatsapp.com", "whatsapp.com"].includes(host)
    )
      return url.toString();
  } catch {}
  return "";
}

export async function GET() {
  await ensureTable();
  const row = await env.DB.prepare(
    "SELECT value FROM platform_settings WHERE key = ?",
  )
    .bind("whatsapp_support")
    .first<{ value: string }>();
  return Response.json({ link: row?.value || "" });
}

export async function PUT(request: Request) {
  await ensureTable();
  const body = (await request.json().catch(() => null)) as {
    link?: string;
  } | null;
  const link = normalizeWhatsAppLink(String(body?.link || ""));
  if (!link)
    return Response.json(
      { error: "Enter a valid WhatsApp number or wa.me link." },
      { status: 400 },
    );
  await env.DB.prepare(
    "INSERT INTO platform_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
  )
    .bind("whatsapp_support", link, Date.now())
    .run();
  return Response.json({ link });
}
