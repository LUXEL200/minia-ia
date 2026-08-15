CREATE TABLE `organizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(128) NOT NULL,
	`description` text,
	`logoUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizations_ownerId_unique` UNIQUE(`ownerId`),
	CONSTRAINT `organizations_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `teamInvitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`role` enum('member','admin') NOT NULL DEFAULT 'member',
	`status` enum('pending','accepted','declined') NOT NULL DEFAULT 'pending',
	`invitedBy` int NOT NULL,
	`invitedTo` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `teamInvitations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `org_owner_idx` ON `organizations` (`ownerId`);--> statement-breakpoint
CREATE INDEX `org_slug_idx` ON `organizations` (`slug`);--> statement-breakpoint
CREATE INDEX `inv_org_idx` ON `teamInvitations` (`orgId`);--> statement-breakpoint
CREATE INDEX `inv_email_idx` ON `teamInvitations` (`email`);