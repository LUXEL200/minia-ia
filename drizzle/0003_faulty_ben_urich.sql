CREATE TABLE `abTests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` text NOT NULL,
	`variantAId` int NOT NULL,
	`variantBId` int NOT NULL,
	`viewsA` int NOT NULL DEFAULT 0,
	`clicksA` int NOT NULL DEFAULT 0,
	`viewsB` int NOT NULL DEFAULT 0,
	`clicksB` int NOT NULL DEFAULT 0,
	`winner` enum('a','b','tie','undecided') NOT NULL DEFAULT 'undecided',
	`status` enum('running','finished') NOT NULL DEFAULT 'running',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `abTests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `imageVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`thumbnailId` int NOT NULL,
	`name` text NOT NULL,
	`imageUrl` text NOT NULL,
	`elements` json NOT NULL,
	`isCurrent` enum('yes','no') NOT NULL DEFAULT 'no',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `imageVersions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `templateCustomizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`templateId` int NOT NULL,
	`title` text NOT NULL,
	`elements` json NOT NULL,
	`backgroundColor` varchar(16) DEFAULT '#000000',
	`thumbnailId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `templateCustomizations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `ab_user_idx` ON `abTests` (`userId`);--> statement-breakpoint
CREATE INDEX `ver_user_idx` ON `imageVersions` (`userId`);--> statement-breakpoint
CREATE INDEX `ver_thumb_idx` ON `imageVersions` (`thumbnailId`);--> statement-breakpoint
CREATE INDEX `custom_user_idx` ON `templateCustomizations` (`userId`);--> statement-breakpoint
CREATE INDEX `custom_template_idx` ON `templateCustomizations` (`templateId`);