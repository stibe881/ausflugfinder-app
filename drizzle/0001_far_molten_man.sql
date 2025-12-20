CREATE TABLE `budgetItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dayPlanId` int NOT NULL,
	`category` varchar(100) NOT NULL,
	`description` varchar(255) NOT NULL,
	`estimatedCost` varchar(20) NOT NULL,
	`actualCost` varchar(20),
	`currency` varchar(10) NOT NULL DEFAULT 'CHF',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `budgetItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `checklistItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dayPlanId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`isCompleted` int NOT NULL DEFAULT 0,
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`dueDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `checklistItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dayPlanItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dayPlanId` int NOT NULL,
	`tripId` int NOT NULL,
	`dayNumber` int NOT NULL DEFAULT 1,
	`orderIndex` int NOT NULL,
	`startTime` varchar(10),
	`endTime` varchar(10),
	`notes` text,
	`dateAssigned` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dayPlanItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dayPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`isPublic` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`isDraft` int NOT NULL DEFAULT 1,
	CONSTRAINT `dayPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `destinations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`location` varchar(255) NOT NULL,
	`imageUrl` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `destinations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `friendships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`friendId` int NOT NULL,
	`status` enum('pending','accepted','blocked') NOT NULL DEFAULT 'pending',
	`requestedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `friendships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`type` enum('friend_request','friend_accepted','nearby_trip','new_trip','system') NOT NULL DEFAULT 'system',
	`relatedId` int,
	`isRead` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `packingListItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dayPlanId` int NOT NULL,
	`item` varchar(255) NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`isPacked` int NOT NULL DEFAULT 0,
	`category` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `packingListItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tripAttributes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tripId` int NOT NULL,
	`attribute` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tripAttributes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tripCategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tripId` int NOT NULL,
	`category` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tripCategories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tripComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tripId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tripComments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tripJournal` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tripId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`entryDate` timestamp NOT NULL,
	`mood` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tripJournal_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tripParticipants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tripId` int NOT NULL,
	`userId` int,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`status` enum('confirmed','pending','declined') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tripParticipants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tripPhotos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tripId` int NOT NULL,
	`photoUrl` varchar(512) NOT NULL,
	`caption` text,
	`isPrimary` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tripPhotos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tripVideos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tripId` int NOT NULL,
	`videoId` varchar(255) NOT NULL,
	`platform` enum('youtube','tiktok') NOT NULL,
	`title` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tripVideos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trips` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`destination` varchar(255) NOT NULL,
	`startDate` timestamp,
	`endDate` timestamp,
	`participants` int NOT NULL DEFAULT 1,
	`status` enum('planned','ongoing','completed','cancelled') NOT NULL DEFAULT 'planned',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`cost` enum('free','low','medium','high','very_high') NOT NULL DEFAULT 'free',
	`ageRecommendation` varchar(50),
	`routeType` enum('round_trip','one_way','location') NOT NULL DEFAULT 'location',
	`region` varchar(100),
	`address` varchar(512),
	`websiteUrl` varchar(512),
	`contactEmail` varchar(320),
	`contactPhone` varchar(50),
	`latitude` varchar(50),
	`longitude` varchar(50),
	`isFavorite` int NOT NULL DEFAULT 0,
	`isDone` int NOT NULL DEFAULT 0,
	`isPublic` int NOT NULL DEFAULT 0,
	`durationMin` decimal(5,2),
	`durationMax` decimal(5,2),
	`distanceMin` decimal(6,2),
	`distanceMax` decimal(6,2),
	`niceToKnow` varchar(500),
	`image` longtext,
	CONSTRAINT `trips_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userLocations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`latitude` varchar(50) NOT NULL,
	`longitude` varchar(50) NOT NULL,
	`accuracy` varchar(50),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userLocations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `friendships_user_id_idx` ON `friendships` (`userId`);--> statement-breakpoint
CREATE INDEX `friendships_friend_id_idx` ON `friendships` (`friendId`);--> statement-breakpoint
CREATE INDEX `notifications_user_id_idx` ON `notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `notifications_is_read_idx` ON `notifications` (`isRead`);--> statement-breakpoint
CREATE INDEX `trip_categories_trip_id_idx` ON `tripCategories` (`tripId`);--> statement-breakpoint
CREATE INDEX `trip_categories_category_idx` ON `tripCategories` (`category`);--> statement-breakpoint
CREATE INDEX `trip_journal_trip_id_idx` ON `tripJournal` (`tripId`);--> statement-breakpoint
CREATE INDEX `trip_journal_user_id_idx` ON `tripJournal` (`userId`);--> statement-breakpoint
CREATE INDEX `trip_videos_trip_id_idx` ON `tripVideos` (`tripId`);--> statement-breakpoint
CREATE INDEX `user_locations_user_id_idx` ON `userLocations` (`userId`);