CREATE TABLE `editorProjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`thumbnailId` int,
	`canvas` json NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `editorProjects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `editor_project_owner_idx` ON `editorProjects` (`userId`);--> statement-breakpoint
CREATE INDEX `editor_project_thumbnail_idx` ON `editorProjects` (`thumbnailId`);