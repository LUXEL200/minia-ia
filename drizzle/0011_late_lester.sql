CREATE TABLE `testimonials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`verified` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`authorName` varchar(128),
	`authorChannel` varchar(128),
	`rating` int NOT NULL DEFAULT 5,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `testimonials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `test_user_idx` ON `testimonials` (`userId`);--> statement-breakpoint
CREATE INDEX `test_verified_idx` ON `testimonials` (`verified`);