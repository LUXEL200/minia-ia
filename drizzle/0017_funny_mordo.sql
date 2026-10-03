CREATE TABLE `appSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`settingKey` varchar(96) NOT NULL,
	`settingValue` text NOT NULL,
	`updatedBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `appSettings_settingKey_unique` UNIQUE(`settingKey`)
);
