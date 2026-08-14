CREATE TABLE `apiKeys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`key` varchar(255) NOT NULL,
	`isActive` enum('active','revoked') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `apiKeys_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `avatars` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`prompt` text NOT NULL,
	`style` varchar(64) DEFAULT 'professional',
	`imageUrl` text NOT NULL,
	`status` enum('generating','completed','failed') NOT NULL DEFAULT 'generating',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `avatars_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `endCards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`prompt` text NOT NULL,
	`style` varchar(64) DEFAULT 'viral',
	`imageUrl` text NOT NULL,
	`status` enum('generating','completed','failed') NOT NULL DEFAULT 'generating',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `endCards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`thumbnailId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` text NOT NULL,
	`message` text,
	`type` enum('generation','credit','team','system') NOT NULL DEFAULT 'system',
	`isRead` enum('read','unread') NOT NULL DEFAULT 'unread',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`title` text NOT NULL,
	`imageUrl` text NOT NULL,
	`source` enum('unsplash','pexels','custom','user') DEFAULT 'custom',
	`category` varchar(64) DEFAULT 'viral',
	`likesCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trashedThumbnails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`thumbnailId` int NOT NULL,
	`prompt` text,
	`imageUrl` text,
	`style` varchar(64),
	`deletedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `trashedThumbnails_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `apikey_user_idx` ON `apiKeys` (`userId`);--> statement-breakpoint
CREATE INDEX `avatar_user_idx` ON `avatars` (`userId`);--> statement-breakpoint
CREATE INDEX `endcard_user_idx` ON `endCards` (`userId`);--> statement-breakpoint
CREATE INDEX `unique_fav_idx` ON `favorites` (`userId`,`thumbnailId`);--> statement-breakpoint
CREATE INDEX `fav_thumb_idx` ON `favorites` (`thumbnailId`);--> statement-breakpoint
CREATE INDEX `notif_user_idx` ON `notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `template_user_idx` ON `templates` (`userId`);--> statement-breakpoint
CREATE INDEX `trash_user_idx` ON `trashedThumbnails` (`userId`);