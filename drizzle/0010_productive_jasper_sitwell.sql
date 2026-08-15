CREATE TABLE `creditPackPurchases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`packId` varchar(32) NOT NULL,
	`packLabel` varchar(64) NOT NULL,
	`creditsGranted` int NOT NULL,
	`amountCents` int NOT NULL,
	`currency` varchar(8) NOT NULL DEFAULT 'EUR',
	`status` enum('completed','refunded','failed') NOT NULL DEFAULT 'completed',
	`paymentId` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `creditPackPurchases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `cpp_user_idx` ON `creditPackPurchases` (`userId`);