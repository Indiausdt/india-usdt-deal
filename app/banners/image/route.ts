import { env } from "cloudflare:workers";

export const runtime = "edge";

async function ensureTable(){
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS hero_banners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_key TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`).run();
}

export async function GET(){
  await ensureTable();
  const result=await env.DB.prepare("SELECT id, image_key AS imageKey, created_at AS createdAt FROM hero_banners ORDER BY created_at ASC").all();
  return Response.json(result.results);
}

export async function POST(request:Request){
  await ensureTable();
  const count=await env.DB.prepare("SELECT COUNT(*) AS total FROM hero_banners").first<{total:number}>();
  if(Number(count?.total||0)>=3)return Response.json({error:"Maximum 3 banners are allowed."},{status:400});
  const data=await request.formData();
  const image=data.get("image");
  if(!(image instanceof File)||!image.type.startsWith("image/"))return Response.json({error:"Please choose a banner image."},{status:400});
  if(image.size>5*1024*1024)return Response.json({error:"Banner must be smaller than 5 MB."},{status:400});
  const imageKey=`hero-banners/${crypto.randomUUID()}`;
  await env.BUCKET.put(imageKey,image.stream(),{httpMetadata:{contentType:image.type}});
  const createdAt=Date.now();
  const inserted=await env.DB.prepare("INSERT INTO hero_banners (image_key, created_at) VALUES (?, ?) RETURNING id").bind(imageKey,createdAt).first<{id:number}>();
  return Response.json({id:inserted?.id,imageKey,createdAt},{status:201});
}

export async function DELETE(request:Request){
  await ensureTable();
  const id=Number(new URL(request.url).searchParams.get("id"));
  if(!Number.isInteger(id)||id<1)return Response.json({error:"Invalid banner."},{status:400});
  const banner=await env.DB.prepare("SELECT image_key AS imageKey FROM hero_banners WHERE id = ?").bind(id).first<{imageKey:string}>();
  if(!banner)return Response.json({error:"Banner not found."},{status:404});
  await env.BUCKET.delete(banner.imageKey);
  await env.DB.prepare("DELETE FROM hero_banners WHERE id = ?").bind(id).run();
  return Response.json({ok:true});
}
