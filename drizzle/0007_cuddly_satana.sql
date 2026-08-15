CREATE TABLE `abTestContributions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`abTestId` int NOT NULL,
	`userId` int NOT NULL,
	`orgId` int,
	`variant` enum('a','b') NOT NULL,
	`views` int NOT NULL DEFAULT 0,
	`clicks` int NOT NULL DEFAULT 0,
	`channelName` varchar(255),
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `abTestContributions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `publishedSchedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`thumbnailId` int NOT NULL,
	`youtubeTitle` text NOT NULL,
	`scheduledAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `publishedSchedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `apiKeys` ADD `expiresAt` timestamp;--> statement-breakpoint
CREATE INDEX `contrib_abtest_idx` ON `abTestContributions` (`abTestId`);--> statement-breakpoint
CREATE INDEX `contrib_user_idx` ON `abTestContributions` (`userId`);--> statement-breakpoint
CREATE INDEX `sched_user_idx` ON `publishedSchedules` (`userId`);--> statement-breakpoint
CREATE INDEX `sched_thumb_idx` ON `publishedSchedules` (`thumbnailId`);