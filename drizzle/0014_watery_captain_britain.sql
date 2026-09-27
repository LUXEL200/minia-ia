CREATE TABLE `creditLedger` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` int NOT NULL,
	`balanceAfter` int NOT NULL,
	`type` enum('debit','refund','grant') NOT NULL,
	`reason` varchar(128) NOT NULL,
	`referenceId` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `creditLedger_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `credit_ledger_user_idx` ON `creditLedger` (`userId`);--> statement-breakpoint
CREATE INDEX `credit_ledger_created_idx` ON `creditLedger` (`createdAt`);