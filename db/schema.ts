import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const sellPosts = sqliteTable("sell_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  message: text("message").notNull(),
  price: text("price").notNull(),
  link: text("link").notNull(),
  imageKey: text("image_key").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const heroBanners = sqliteTable("hero_banners", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  imageKey: text("image_key").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const platformSettings = sqliteTable("platform_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at").notNull(),
});
