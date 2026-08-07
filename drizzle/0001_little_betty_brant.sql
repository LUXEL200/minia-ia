CREATE TABLE `teamMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('member','admin') NOT NULL DEFAULT 'member',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `teamMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teamTasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`thumbnailId` int NOT NULL,
	`assigneeId` int,
	`status` enum('pending','reviewing','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
	`comment` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teamTasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `thumbnailLikes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`thumbnailId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `thumbnailLikes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `team_owner_idx` ON `teamMembers` (`ownerId`);--> statement-breakpoint
CREATE INDEX `unique_member_idx` ON `teamMembers` (`ownerId`,`userId`);--> statement-breakpoint
CREATE INDEX `task_owner_idx` ON `teamTasks` (`ownerId`);--> statement-breakpoint
CREATE INDEX `task_thumb_idx` ON `teamTasks` (`thumbnailId`);--> statement-breakpoint
CREATE INDEX `unique_like_idx` ON `thumbnailLikes` (`userId`,`thumbnailId`);--> statement-breakpoint
CREATE INDEX `thumb_like_idx` ON `thumbnailLikes` (`thumbnailId`);