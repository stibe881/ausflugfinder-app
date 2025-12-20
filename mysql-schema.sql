mysqldump: [Warning] Using a password on the command line interface can be insecure.
-- Warning: column statistics not supported by the server.

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `ausfluege`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ausfluege` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `beschreibung` text DEFAULT NULL,
  `adresse` varchar(255) NOT NULL,
  `land` varchar(50) DEFAULT 'Schweiz',
  `region` varchar(100) DEFAULT NULL,
  `kategorie_alt` varchar(100) DEFAULT NULL,
  `parkplatz` varchar(100) DEFAULT NULL,
  `parkplatz_kostenlos` tinyint(1) DEFAULT 0,
  `kosten_stufe` tinyint(4) DEFAULT NULL,
  `jahreszeiten` varchar(100) DEFAULT NULL,
  `website_url` varchar(255) DEFAULT NULL,
  `lat` decimal(10,7) DEFAULT NULL,
  `lng` decimal(10,7) DEFAULT NULL,
  `coordinates` point DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `nice_to_know` varchar(255) DEFAULT NULL,
  `dauer_min` decimal(5,2) DEFAULT NULL,
  `dauer_max` decimal(5,2) DEFAULT NULL,
  `distanz_min` decimal(6,2) DEFAULT NULL,
  `distanz_max` decimal(6,2) DEFAULT NULL,
  `dauer_stunden` decimal(5,2) DEFAULT NULL,
  `distanz_km` decimal(6,2) DEFAULT NULL,
  `is_rundtour` tinyint(1) NOT NULL DEFAULT 0,
  `is_von_a_nach_b` tinyint(1) NOT NULL DEFAULT 0,
  `altersempfehlung` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `region` (`region`),
  KEY `kosten_stufe` (`kosten_stufe`),
  KEY `idx_lat_lng` (`lat`,`lng`),
  KEY `idx_needs_geocoding` (`lat`),
  CONSTRAINT `fk_ausfluege_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=79 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`dev_ausflugfinder`@`%`*/ /*!50003 TRIGGER `ausfluege_insert_coordinates`
BEFORE INSERT ON `ausfluege`
FOR EACH ROW
BEGIN
IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
SET NEW.coordinates = POINT(NEW.lng, NEW.lat);
END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `ausflug_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ausflug_images` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `ausflug_id` int(11) unsigned NOT NULL,
  `filename` varchar(255) NOT NULL,
  `is_title_image` tinyint(1) NOT NULL DEFAULT 0,
  `uploaded_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `ausflug_id` (`ausflug_id`),
  CONSTRAINT `ausflug_images_ibfk_1` FOREIGN KEY (`ausflug_id`) REFERENCES `ausfluege` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `ausflug_kategorien`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ausflug_kategorien` (
  `ausflug_id` int(10) unsigned NOT NULL,
  `kategorie_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`ausflug_id`,`kategorie_id`),
  KEY `kategorie_id` (`kategorie_id`),
  CONSTRAINT `fk_ak_a` FOREIGN KEY (`ausflug_id`) REFERENCES `ausfluege` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ak_k` FOREIGN KEY (`kategorie_id`) REFERENCES `kategorien` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `benachrichtigungen`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `benachrichtigungen` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `typ` varchar(100) NOT NULL,
  `payload` longtext DEFAULT NULL,
  `is_read` tinyint(4) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`,`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `bewertungen`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bewertungen` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `ausflug_id` int(10) unsigned NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `allgemein` tinyint(4) NOT NULL,
  `preis` tinyint(4) NOT NULL,
  `kinder` tinyint(4) NOT NULL,
  `erwachsene` tinyint(4) NOT NULL,
  `kommentar` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_rating` (`ausflug_id`,`user_id`),
  KEY `ausflug_id` (`ausflug_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_b_a` FOREIGN KEY (`ausflug_id`) REFERENCES `ausfluege` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_b_u` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `campaign_recipients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `campaign_recipients` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `campaign_id` int(10) unsigned NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `email_address` varchar(190) NOT NULL,
  `sent_at` datetime DEFAULT NULL,
  `opened_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_recipient` (`campaign_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `campaign_recipients_ibfk_1` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE,
  CONSTRAINT `campaign_recipients_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `campaigns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `campaigns` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `template_id` int(10) unsigned DEFAULT NULL,
  `status` enum('draft','sending','sent') NOT NULL DEFAULT 'draft',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `sent_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `child_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `child_permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `child_id` int(11) NOT NULL,
  `permission_type` varchar(50) NOT NULL,
  `is_allowed` tinyint(1) DEFAULT 1,
  `set_by_parent_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_child_permission` (`child_id`,`permission_type`),
  KEY `idx_child` (`child_id`)
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `excursion_animals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `excursion_animals` (
  `excursion_id` int(10) unsigned NOT NULL,
  `animal_id` int(11) NOT NULL,
  PRIMARY KEY (`excursion_id`,`animal_id`),
  KEY `idx_ea_excursion` (`excursion_id`),
  KEY `idx_ea_animal` (`animal_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `excursion_plants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `excursion_plants` (
  `excursion_id` int(10) unsigned NOT NULL,
  `plant_id` int(11) NOT NULL,
  PRIMARY KEY (`excursion_id`,`plant_id`),
  KEY `idx_ep_excursion` (`excursion_id`),
  KEY `idx_ep_plant` (`plant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `excursion_sticker_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `excursion_sticker_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `excursion_id` int(11) NOT NULL,
  `sticker_category` varchar(100) NOT NULL COMMENT 'z.B. "Schloss", "Tierpark", "Spielplatz", etc.',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_excursion_category` (`excursion_id`,`sticker_category`),
  KEY `idx_excursion` (`excursion_id`),
  KEY `idx_category` (`sticker_category`)
) ENGINE=InnoDB AUTO_INCREMENT=288 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Sticker-Kategorien für dynamische Sticker-Vergabe an Kinder';
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `excursion_sticker_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `excursion_sticker_images` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `excursion_id` int(11) NOT NULL,
  `sticker_category` varchar(100) NOT NULL COMMENT 'z.B. "Schloss", "Tierpark", etc.',
  `image_filename` varchar(255) NOT NULL COMMENT 'Dateiname des hochgeladenen Sticker-Bildes',
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_excursion_category_image` (`excursion_id`,`sticker_category`),
  KEY `idx_excursion` (`excursion_id`),
  KEY `idx_category` (`sticker_category`)
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Manuell hochgeladene Sticker-Bilder für Ausflüge';
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `familien`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `familien` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `gruender_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `gruender_id` (`gruender_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `familien_einladungen`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `familien_einladungen` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `familien_id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `invited_by` int(11) NOT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `accepted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_invitation` (`familien_id`,`email`),
  KEY `familien_id` (`familien_id`),
  KEY `invited_by` (`invited_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `familien_mitglieder`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `familien_mitglieder` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `familien_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `rolle` varchar(50) DEFAULT 'mitglied',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_family_user` (`familien_id`,`user_id`),
  KEY `familien_id` (`familien_id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `favoriten`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `favoriten` (
  `user_id` int(10) unsigned NOT NULL,
  `ausflug_id` int(10) unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`user_id`,`ausflug_id`),
  UNIQUE KEY `ux_favoriten_user_ausflug` (`user_id`,`ausflug_id`),
  KEY `fk_fav_a` (`ausflug_id`),
  CONSTRAINT `fk_fav_a` FOREIGN KEY (`ausflug_id`) REFERENCES `ausfluege` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_fav_u` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `fotos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fotos` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `ausflug_id` int(10) unsigned NOT NULL,
  `user_id` int(10) unsigned DEFAULT NULL,
  `rating_id` int(10) unsigned DEFAULT NULL,
  `path` varchar(255) NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `ausflug_id` (`ausflug_id`),
  KEY `user_id` (`user_id`),
  KEY `rating_id` (`rating_id`),
  KEY `idx_is_primary_ausflug` (`is_primary`,`ausflug_id`),
  CONSTRAINT `fk_f_r` FOREIGN KEY (`rating_id`) REFERENCES `bewertungen` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_f_u` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=212 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `friend_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `friend_requests` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `requester_user_id` int(10) unsigned NOT NULL,
  `recipient_user_id` int(10) unsigned NOT NULL,
  `status` enum('pending','accepted','declined') NOT NULL DEFAULT 'pending',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `decided_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_pair` (`requester_user_id`,`recipient_user_id`),
  KEY `recipient_user_id` (`recipient_user_id`),
  KEY `requester_user_id` (`requester_user_id`),
  CONSTRAINT `fk_frq_rec` FOREIGN KEY (`recipient_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_frq_req` FOREIGN KEY (`requester_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `friends`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `friends` (
  `user_id` int(10) unsigned NOT NULL,
  `friend_user_id` int(10) unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`user_id`,`friend_user_id`),
  KEY `friend_user_id` (`friend_user_id`),
  CONSTRAINT `fk_fr_f` FOREIGN KEY (`friend_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_fr_u` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `friendships`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `friendships` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `friendId` int(11) NOT NULL,
  `status` enum('pending','accepted','blocked') NOT NULL DEFAULT 'pending',
  `requestedBy` int(11) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `friendships_user_id_idx` (`userId`),
  KEY `friendships_friend_id_idx` (`friendId`),
  KEY `friendships_status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `gemacht`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gemacht` (
  `user_id` int(10) unsigned NOT NULL,
  `ausflug_id` int(10) unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`user_id`,`ausflug_id`),
  UNIQUE KEY `ux_gemacht_user_ausflug` (`user_id`,`ausflug_id`),
  KEY `fk_g_a` (`ausflug_id`),
  CONSTRAINT `fk_g_a` FOREIGN KEY (`ausflug_id`) REFERENCES `ausfluege` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_g_u` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `gutscheine`;
/*!50001 DROP VIEW IF EXISTS `gutscheine`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `gutscheine` AS SELECT 
 1 AS `id`,
 1 AS `user_id`,
 1 AS `kategorie_id`,
 1 AS `familien_id`,
 1 AS `name`,
 1 AS `code`,
 1 AS `location`,
 1 AS `restwert`,
 1 AS `ursprungswert`,
 1 AS `gueltig_bis`,
 1 AS `gueltig_von`,
 1 AS `notizen`,
 1 AS `foto_vorderseite_path`,
 1 AS `foto_rueckseite_path`,
 1 AS `status`,
 1 AS `gutschein_typ`,
 1 AS `geteilt_mit_familie`,
 1 AS `created_at`,
 1 AS `updated_at`*/;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `kategorien`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kategorien` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `kids_achievements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kids_achievements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `icon` varchar(10) NOT NULL,
  `category` varchar(50) DEFAULT NULL,
  `rarity` enum('common','rare','epic','legendary') DEFAULT 'common',
  `condition_type` varchar(50) NOT NULL,
  `condition_value` int(11) NOT NULL,
  `points_reward` int(11) NOT NULL DEFAULT 50,
  `badge_image` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `kids_activity_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kids_activity_log` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `activity_type` varchar(100) NOT NULL COMMENT 'visit, quiz, achievement, etc.',
  `activity_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Details der Aktivität' CHECK (json_valid(`activity_data`)),
  `points_earned` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_type` (`activity_type`),
  KEY `idx_created` (`created_at`),
  CONSTRAINT `kids_activity_log_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `kids_animals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kids_animals` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `scientific_name` varchar(100) DEFAULT NULL,
  `category` enum('mammal','bird','reptile','amphibian','fish','insect') NOT NULL,
  `icon` varchar(10) NOT NULL,
  `description` text NOT NULL,
  `habitat` text NOT NULL,
  `diet_type` varchar(50) DEFAULT NULL,
  `fun_facts` text DEFAULT NULL,
  `conservation_status` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `kids_certificates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kids_certificates` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `certificate_type` varchar(100) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `achievement_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Daten für das Zertifikat' CHECK (json_valid(`achievement_data`)),
  `issued_at` timestamp NULL DEFAULT current_timestamp(),
  `pdf_generated` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_type` (`certificate_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `kids_checkins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kids_checkins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `excursion_id` int(11) NOT NULL,
  `latitude` decimal(10,7) NOT NULL COMMENT 'GPS-Position des Kindes beim Check-in',
  `longitude` decimal(10,7) NOT NULL COMMENT 'GPS-Position des Kindes beim Check-in',
  `distance_meters` decimal(8,2) NOT NULL COMMENT 'Distanz zum Ausflug in Metern',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_excursion` (`user_id`,`excursion_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_excursion` (`excursion_id`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Kinder-Check-ins mit GPS-Verifikation';
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `kids_collected_stickers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kids_collected_stickers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT 'Kind-User ID',
  `excursion_id` int(11) NOT NULL,
  `sticker_category` varchar(100) NOT NULL,
  `collected_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_excursion_category` (`user_id`,`excursion_id`,`sticker_category`),
  KEY `idx_user` (`user_id`),
  KEY `idx_excursion` (`excursion_id`),
  KEY `idx_category` (`sticker_category`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Gesammelte Sticker der Kinder';
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `kids_event_participation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kids_event_participation` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `event_id` int(10) unsigned NOT NULL,
  `points_earned` int(11) DEFAULT 0,
  `activities_completed` int(11) DEFAULT 0,
  `completed` tinyint(1) DEFAULT 0,
  `completed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_event` (`user_id`,`event_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_event` (`event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `kids_family_challenges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kids_family_challenges` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `family_id` int(10) unsigned NOT NULL,
  `challenge_type` varchar(100) NOT NULL COMMENT 'team_visits, total_points, etc.',
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `goal_value` int(11) NOT NULL COMMENT 'Zielwert (z.B. 10 Besuche)',
  `current_value` int(11) DEFAULT 0,
  `points_reward` int(11) DEFAULT 200,
  `status` enum('active','completed','expired') DEFAULT 'active',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `completed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_family` (`family_id`),
  KEY `idx_status` (`status`),
  KEY `idx_dates` (`start_date`,`end_date`),
  CONSTRAINT `kids_family_challenges_ibfk_1` FOREIGN KEY (`family_id`) REFERENCES `kids_family_groups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `kids_family_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kids_family_groups` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `family_name` varchar(200) NOT NULL,
  `parent_user_id` int(10) unsigned NOT NULL COMMENT 'Hauptelternteil',
  `invite_code` varchar(50) DEFAULT NULL COMMENT 'Code für andere Eltern',
  `total_family_points` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `invite_code` (`invite_code`),
  KEY `idx_parent` (`parent_user_id`),
  KEY `idx_invite` (`invite_code`),
  CONSTRAINT `kids_family_groups_ibfk_1` FOREIGN KEY (`parent_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `kids_family_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kids_family_members` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `family_id` int(10) unsigned NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `role` enum('parent','child') DEFAULT 'child',
  `nickname` varchar(100) DEFAULT NULL,
  `joined_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_family_user` (`family_id`,`user_id`),
  KEY `idx_family` (`family_id`),
  KEY `idx_user` (`user_id`),
  CONSTRAINT `kids_family_members_ibfk_1` FOREIGN KEY (`family_id`) REFERENCES `kids_family_groups` (`id`) ON DELETE CASCADE,
  CONSTRAINT `kids_family_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `kids_family_rewards_pool`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kids_family_rewards_pool` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `family_id` int(10) unsigned NOT NULL,
  `total_points` int(11) DEFAULT 0,
  `reward_name` varchar(200) DEFAULT NULL COMMENT 'Aktuelles Sparziel',
  `reward_goal` int(11) DEFAULT NULL COMMENT 'Punkteziel für Belohnung',
  `reward_description` text DEFAULT NULL,
  `reward_unlocked` tinyint(1) DEFAULT 0,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_family_pool` (`family_id`),
  CONSTRAINT `kids_family_rewards_pool_ibfk_1` FOREIGN KEY (`family_id`) REFERENCES `kids_family_groups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `kids_geography_games`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kids_geography_games` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `game_type` enum('map_quiz','canton_match','landmark_finder','distance_guess') DEFAULT 'map_quiz',
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `difficulty` enum('easy','medium','hard') DEFAULT 'medium',
  `questions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'Game questions/tasks' CHECK (json_valid(`questions`)),
  `points_reward` int(11) DEFAULT 50,
  `time_limit_seconds` int(11) DEFAULT 300,
  `min_level` int(11) DEFAULT 1,
  `icon` varchar(10) DEFAULT '?️',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_type` (`game_type`),
  KEY `idx_difficulty` (`difficulty`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `kids_historical_facts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kids_historical_facts` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `ausflug_id` int(10) unsigned DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `period` varchar(100) DEFAULT NULL COMMENT 'Römerzeit, Mittelalter, etc.',
  `year_from` int(11) DEFAULT NULL,
  `year_to` int(11) DEFAULT NULL,
  `content` text NOT NULL,
  `fun_fact` text DEFAULT NULL,
  `icon` varchar(10) DEFAULT '?',
  `image_url` varchar(500) DEFAULT NULL,
  `quiz_question` text DEFAULT NULL,
  `quiz_answer` text DEFAULT NULL,
  `points_value` int(11) DEFAULT 25,
  `difficulty` enum('easy','medium','hard') DEFAULT 'medium',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_ausflug` (`ausflug_id`),
  KEY `idx_period` (`period`),
  CONSTRAINT `kids_historical_facts_ibfk_1` FOREIGN KEY (`ausflug_id`) REFERENCES `ausfluege` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `kids_levels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kids_levels` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `level_number` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `points_required` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  `icon` varchar(10) DEFAULT NULL,
  `reward_message` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `level_number` (`level_number`)
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `kids_mystery_unlocks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kids_mystery_unlocks` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `region` varchar(100) NOT NULL,
  `unlocked_at` timestamp NULL DEFAULT current_timestamp(),
  `unlock_method` enum('visit','challenge','code') DEFAULT 'visit',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_region` (`user_id`,`region`),
  KEY `idx_user` (`user_id`),
  KEY `idx_region` (`region`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `kids_nino_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kids_nino_messages` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `message_text` text NOT NULL,
  `message_type` enum('encouragement','tip','fun_fact','challenge','celebration') NOT NULL,
  `trigger_condition` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Optional: Bedingungen wann die Nachricht erscheint' CHECK (json_valid(`trigger_condition`)),
  `icon` varchar(10) DEFAULT '?️',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `kids_parent_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kids_parent_settings` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `parent_user_id` int(10) unsigned NOT NULL,
  `child_user_id` int(10) unsigned NOT NULL,
  `allow_location_sharing` tinyint(1) DEFAULT 1,
  `allow_photos` tinyint(1) DEFAULT 1,
  `allow_chat` tinyint(1) DEFAULT 0,
  `allow_friend_requests` tinyint(1) DEFAULT 1,
  `max_screen_time_minutes` int(11) DEFAULT 60,
  `content_filter_level` enum('strict','moderate','relaxed') DEFAULT 'moderate',
  `notification_email` varchar(255) DEFAULT NULL,
  `weekly_report` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_parent_child` (`parent_user_id`,`child_user_id`),
  KEY `idx_parent` (`parent_user_id`),
  KEY `idx_child` (`child_user_id`),
  CONSTRAINT `kids_parent_settings_ibfk_1` FOREIGN KEY (`parent_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `kids_parent_settings_ibfk_2` FOREIGN KEY (`child_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `kids_plants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kids_plants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `scientific_name` varchar(100) DEFAULT NULL,
  `plant_type` enum('tree','flower','shrub','herb','fern','moss') NOT NULL,
  `icon` varchar(10) NOT NULL,
  `description` text NOT NULL,
  `habitat` text NOT NULL,
  `growth_info` text DEFAULT NULL,
  `fun_facts` text DEFAULT NULL,
  `uses` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_plant_type` (`plant_type`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `kids_points_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kids_points_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `points` int(11) NOT NULL,
  `reason` varchar(100) DEFAULT NULL,
  `reference_type` varchar(50) DEFAULT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `kids_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kids_profiles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `display_name` varchar(50) NOT NULL,
  `age_group` enum('mini','junior','teen') NOT NULL DEFAULT 'junior',
  `gender` enum('boy','girl','neutral') DEFAULT 'neutral',
  `avatar_character` varchar(50) DEFAULT 'nino',
  `avatar_outfit` varchar(50) DEFAULT 'default',
  `total_points` int(11) NOT NULL DEFAULT 0,
  `current_level` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_level` (`current_level`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `kids_quiz_animals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kids_quiz_animals` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quiz_id` int(11) NOT NULL,
  `animal_id` int(11) NOT NULL,
  `unlock_threshold` int(11) DEFAULT 70 COMMENT 'Min. Prozent zum Freischalten (0-100)',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_quiz_animal` (`quiz_id`,`animal_id`),
  KEY `idx_quiz_id` (`quiz_id`),
  KEY `idx_animal_id` (`animal_id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `kids_quiz_plants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kids_quiz_plants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quiz_id` int(11) NOT NULL,
  `plant_id` int(11) NOT NULL,
  `unlock_threshold` int(11) DEFAULT 70 COMMENT 'Min. Prozent zum Freischalten (0-100)',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_quiz_plant` (`quiz_id`,`plant_id`),
  KEY `idx_quiz_id` (`quiz_id`),
  KEY `idx_plant_id` (`plant_id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `kids_quiz_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kids_quiz_questions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `quiz_id` int(10) unsigned NOT NULL,
  `question_text` text NOT NULL,
  `question_type` enum('multiple_choice','true_false','image_choice') DEFAULT 'multiple_choice',
  `options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'Array of answer options' CHECK (json_valid(`options`)),
  `correct_answer` varchar(200) NOT NULL,
  `explanation` text DEFAULT NULL COMMENT 'Erklärung nach Beantwortung',
  `fun_fact` text DEFAULT NULL COMMENT 'Zusätzlicher Fun Fact',
  `image_url` varchar(500) DEFAULT NULL,
  `order_position` int(11) DEFAULT 0,
  `points` int(11) DEFAULT 10,
  PRIMARY KEY (`id`),
  KEY `idx_quiz` (`quiz_id`),
  CONSTRAINT `kids_quiz_questions_ibfk_1` FOREIGN KEY (`quiz_id`) REFERENCES `kids_quizzes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=76 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `kids_quizzes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kids_quizzes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `ausflug_id` int(10) unsigned DEFAULT NULL,
  `category` varchar(100) NOT NULL COMMENT 'zoo, museum, nature, history, etc.',
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `icon` varchar(10) DEFAULT '❓',
  `difficulty` enum('easy','medium','hard') DEFAULT 'medium',
  `points_reward` int(11) DEFAULT 50,
  `min_level` int(11) DEFAULT 1 COMMENT 'Mindest-Level um Quiz zu spielen',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`),
  KEY `idx_ausflug` (`ausflug_id`),
  CONSTRAINT `kids_quizzes_ibfk_1` FOREIGN KEY (`ausflug_id`) REFERENCES `ausfluege` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `kids_seasonal_challenges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kids_seasonal_challenges` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `description` text NOT NULL,
  `season` enum('spring','summer','autumn','winter') NOT NULL,
  `icon` varchar(10) DEFAULT '?',
  `requirement` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`requirement`)),
  `reward_points` int(11) DEFAULT 200,
  `reward_badge` varchar(100) DEFAULT NULL,
  `year` int(11) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_season` (`season`,`year`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `kids_seasonal_progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kids_seasonal_progress` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `challenge_id` int(10) unsigned NOT NULL,
  `progress` int(11) DEFAULT 0,
  `completed` tinyint(1) DEFAULT 0,
  `completed_at` timestamp NULL DEFAULT NULL,
  `proof_photos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Foto-URLs' CHECK (json_valid(`proof_photos`)),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_challenge` (`user_id`,`challenge_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_challenge` (`challenge_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `kids_secret_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kids_secret_locations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `fantasy_name` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `region` varchar(100) DEFAULT NULL,
  `challenge_type` enum('points','visits','stickers','achievements','regions','streak_days','combo') NOT NULL,
  `challenge_requirement` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'JSON with challenge details' CHECK (json_valid(`challenge_requirement`)),
  `reward_points` int(11) DEFAULT 100,
  `reward_sticker_id` int(11) DEFAULT NULL,
  `icon` varchar(50) DEFAULT '?',
  `rarity` enum('rare','epic','legendary') DEFAULT 'epic',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_region` (`region`),
  KEY `idx_rarity` (`rarity`),
  KEY `reward_sticker_id` (`reward_sticker_id`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `kids_secret_unlocks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 