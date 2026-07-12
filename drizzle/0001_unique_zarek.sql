CREATE TABLE `fleet_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`missionName` varchar(255) NOT NULL,
	`domain` varchar(255),
	`description` text,
	`missionBadge` varchar(64) NOT NULL DEFAULT 'Nova Spark',
	`statusBoardScore` int NOT NULL DEFAULT 0,
	`plainStatus` varchar(255) NOT NULL DEFAULT 'Preparing for launch',
	`clearanceStatus` enum('clear-skies','weather-warning','launch-paused') NOT NULL DEFAULT 'weather-warning',
	`launchStage` enum('mission-brief','nova-spark','systems-check','assembly','launch-clearance','in-orbit') NOT NULL DEFAULT 'mission-brief',
	`monthlyRevenueCents` bigint NOT NULL DEFAULT 0,
	`monthlyCostCents` bigint NOT NULL DEFAULT 0,
	`isArchived` boolean NOT NULL DEFAULT false,
	`lastActivityAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fleet_products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `flight_recorder` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`userId` int NOT NULL,
	`eventType` varchar(64) NOT NULL,
	`logEntry` text NOT NULL,
	`payload` json,
	`triggeredBy` enum('user','aria','system','webhook') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `flight_recorder_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `launch_sequences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`userId` int NOT NULL,
	`stage` enum('mission-brief','nova-spark','systems-check','assembly','launch-clearance') NOT NULL,
	`status` enum('pending','in-progress','complete','blocked') NOT NULL DEFAULT 'pending',
	`ariaGuidance` text,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `launch_sequences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mission_leases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`userId` int NOT NULL,
	`leaseName` varchar(255) NOT NULL,
	`leaseType` enum('domain','subscription','license','hosting','other') NOT NULL DEFAULT 'subscription',
	`provider` varchar(128),
	`monthlyCostCents` bigint NOT NULL DEFAULT 0,
	`billingCycle` enum('monthly','annual','one-off') NOT NULL DEFAULT 'monthly',
	`renewsAt` timestamp,
	`autoRenew` boolean NOT NULL DEFAULT true,
	`status` enum('active','expiring-soon','expired','cancelled') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mission_leases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mission_vault` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`userId` int NOT NULL,
	`keyLabel` varchar(128) NOT NULL,
	`keyCategory` enum('payment','domain','email','hosting','analytics','auth','other') NOT NULL DEFAULT 'other',
	`encryptedValue` text NOT NULL,
	`lastRotatedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mission_vault_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `spark_missions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int,
	`userId` int NOT NULL,
	`ideaName` varchar(255) NOT NULL,
	`ideaDescription` text,
	`targetAudience` text,
	`problemSolved` text,
	`sparkScore` int NOT NULL DEFAULT 0,
	`scoreLabel` varchar(64) NOT NULL DEFAULT 'Pending',
	`marketClarity` int NOT NULL DEFAULT 0,
	`problemFit` int NOT NULL DEFAULT 0,
	`audienceDefinition` int NOT NULL DEFAULT 0,
	`analysisPayload` json,
	`tier` enum('free','pro') NOT NULL DEFAULT 'free',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `spark_missions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `plan` enum('free','pro','enterprise') DEFAULT 'free' NOT NULL;