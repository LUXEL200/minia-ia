CREATE TABLE `adminAccess` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`role` enum('support','analyst','operator') NOT NULL,
	`permissions` json NOT NULL,
	`enabled` enum('yes','no') NOT NULL DEFAULT 'yes',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `adminAccess_id` PRIMARY KEY(`id`),
	CONSTRAINT `adminAccess_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `scheduledExports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`createdBy` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`reportType` enum('metrics','timeline') NOT NULL,
	`format` enum('csv','pdf') NOT NULL,
	`cron` varchar(64) NOT NULL,
	`filters` json NOT NULL,
	`scheduleTaskUid` varchar(65),
	`status` enum('active','paused','failed') NOT NULL DEFAULT 'active',
	`lastRunAt` timestamp,
	`lastError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scheduledExports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `admin_access_user_idx` ON `adminAccess` (`userId`);--> statement-breakpoint
CREATE INDEX `scheduled_export_owner_idx` ON `scheduledExports` (`createdBy`);--> statement-breakpoint
CREATE INDEX `scheduled_export_task_idx` ON `scheduledExports` (`scheduleTaskUid`);