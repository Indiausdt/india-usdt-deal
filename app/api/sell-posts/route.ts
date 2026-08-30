import { env } from "cloudflare:workers";

export const runtime = "edge";

async function ensureTable() {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS sell_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT NOT NULL,
    price TEXT NOT NULL,
    link TEXT NOT NULL,
    image_key TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`).run();
}

export async function GET() {
  await ensureTable();
  const result = await env.DB.prepare("SELECT id, message, price, link, image_key AS imageKey, created_at AS createdAt FROM sell_posts ORDER BY created_at DESC").all();
  return Response.json(result.results);
}

export async function POST(request: Request) {
  await ensureTable();
  const data = await request.formData();
  const image = data.get("image");
  const message = String(data.get("message") || "").trim();
  const price = String(data.get("price") || "").trim();
  const link = String(data.get("link") || "").trim();
  if (!(image instanceof File) || !image.type.startsWith("image/")) return Response.json({ error: "Please choose an image." }, { status: 400 });
  if (image.size > 4 * 1024 * 1024) return Response.json({ error: "Image must be smaller than 4 MB." }, { status: 400 });
  if (!message || !price || !link) return Response.json({ error: "All fields are required." }, { status: 400 });
  try { new URL(link); } catch { return Response.json({ error: "Please enter a valid link." }, { status: 400 }); }
  const key = `sell-posts/${crypto.randomUUID()}`;
  await env.BUCKET.put(key, image.stream(), { httpMetadata: { contentType: image.type } });
  const createdAt = Date.now();
  const inserted = await env.DB.prepare("INSERT INTO sell_posts (message, price, link, image_key, created_at) VALUES (?, ?, ?, ?, ?) RETURNING id")
    .bind(message, price, link, key, createdAt).first<{ id: number }>();
  return Response.json({ id: inserted?.id, message, price, link, imageKey: key, createdAt }, { status: 201 });
}

export async function DELETE(request: Request) {
  await ensureTable();
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id < 1) return Response.json({ error: "Invalid post." }, { status: 400 });
  const post = await env.DB.prepare("SELECT image_key AS imageKey FROM sell_posts WHERE id = ?").bind(id).first<{ imageKey: string }>();
  if (!post) return Response.json({ error: "Post not found." }, { status: 404 });
  await env.BUCKET.delete(post.imageKey);
  await env.DB.prepare("DELETE FROM sell_posts WHERE id = ?").bind(id).run();
  return Response.json({ ok: true });
}
