ALTER TABLE `userCredits` MODIFY COLUMN `credits` int NOT NULL DEFAULT 5;--> statement-breakpoint
ALTER TABLE `userCredits` ADD `quotaPeriodStart` timestamp DEFAULT (now()) NOT NULL;