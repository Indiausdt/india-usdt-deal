CREATE TABLE `sell_posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`message` text NOT NULL,
	`price` text NOT NULL,
	`link` text NOT NULL,
	`image_key` text NOT NULL,
	`created_at` integer NOT NULL
);
