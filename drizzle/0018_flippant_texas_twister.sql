CREATE TABLE `publicGallery` (
	`id` int AUTO_INCREMENT NOT NULL,
	`imageUrl` text NOT NULL,
	`title` text NOT NULL,
	`style` varchar(64) NOT NULL DEFAULT 'viral',
	`category` varchar(64) NOT NULL DEFAULT 'featured',
	`isVisible` int NOT NULL DEFAULT 1,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `publicGallery_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `public_gallery_visible_idx` ON `publicGallery` (`isVisible`,`sortOrder`);--> statement-breakpoint
CREATE INDEX `public_gallery_category_idx` ON `publicGallery` (`category`);