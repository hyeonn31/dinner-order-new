CREATE TABLE `accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(100) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`nickname` varchar(100) NOT NULL,
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`employeeId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `accounts_username_unique` UNIQUE(`username`),
	CONSTRAINT `accounts_nickname_unique` UNIQUE(`nickname`)
);
