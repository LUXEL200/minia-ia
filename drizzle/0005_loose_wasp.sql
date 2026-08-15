ALTER TABLE `abTests` ADD `shareToken` varchar(64);--> statement-breakpoint
ALTER TABLE `thumbnails` ADD `youtubeTitle` text;--> statement-breakpoint
ALTER TABLE `thumbnails` ADD `youtubeStatus` enum('unplanned','planned') DEFAULT 'unplanned' NOT NULL;