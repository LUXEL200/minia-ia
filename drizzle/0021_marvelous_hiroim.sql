CREATE TABLE `guestDemoUsage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usageKey` varchar(191) NOT NULL,
	`periodStart` timestamp NOT NULL,
	`count` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `guestDemoUsage_id` PRIMARY KEY(`id`),
	CONSTRAINT `guestDemoUsage_usageKey_unique` UNIQUE(`usageKey`)
);
--> statement-breakpoint
CREATE INDEX `guest_demo_period_idx` ON `guestDemoUsage` (`periodStart`);