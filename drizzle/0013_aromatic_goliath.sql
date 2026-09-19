CREATE TABLE `adminAuditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorUserId` int NOT NULL,
	`action` enum('legacy_keys_revoked','users_notified') NOT NULL,
	`targetUserId` int,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `adminAuditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `admin_audit_created_idx` ON `adminAuditLogs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `admin_audit_actor_idx` ON `adminAuditLogs` (`actorUserId`);