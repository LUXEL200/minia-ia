CREATE TABLE `adminTotp` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`secretCipher` text NOT NULL,
	`enabled` enum('yes','no') NOT NULL DEFAULT 'no',
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `adminTotp_id` PRIMARY KEY(`id`),
	CONSTRAINT `adminTotp_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `adminAccess` MODIFY COLUMN `role` enum('admin','moderator','support','analyst','operator','read_only') NOT NULL;--> statement-breakpoint
ALTER TABLE `adminAuditLogs` MODIFY COLUMN `action` varchar(96) NOT NULL;--> statement-breakpoint
ALTER TABLE `adminAuditLogs` ADD `ipAddress` varchar(64);--> statement-breakpoint
ALTER TABLE `adminAuditLogs` ADD `beforeValue` text;--> statement-breakpoint
ALTER TABLE `adminAuditLogs` ADD `afterValue` text;--> statement-breakpoint
ALTER TABLE `users` ADD `status` enum('active','suspended','banned') DEFAULT 'active' NOT NULL;--> statement-breakpoint
CREATE INDEX `admin_totp_user_idx` ON `adminTotp` (`userId`);