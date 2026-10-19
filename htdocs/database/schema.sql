-- ==========================================================
-- SignAI v2.0 — Schema Completo
-- Motor: MySQL 5.7+ / MariaDB 10.2+
-- Charset: utf8mb4_unicode_ci
-- ==========================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

-- Eliminar tablas existentes (en orden inverso por FKs)
DROP TABLE IF EXISTS `user_achievements`;
DROP TABLE IF EXISTS `achievements`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `chat_messages`;
DROP TABLE IF EXISTS `chat_sessions`;
DROP TABLE IF EXISTS `tournament_participants`;
DROP TABLE IF EXISTS `tournaments`;
DROP TABLE IF EXISTS `daily_challenges`;
DROP TABLE IF EXISTS `detection_history`;
DROP TABLE IF EXISTS `user_progress`;
DROP TABLE IF EXISTS `lesson_items`;
DROP TABLE IF EXISTS `lessons`;
DROP TABLE IF EXISTS `words`;
DROP TABLE IF EXISTS `letters`;
DROP TABLE IF EXISTS `user_sessions`;
DROP TABLE IF EXISTS `password_resets`;
DROP TABLE IF EXISTS `email_verifications`;
DROP TABLE IF EXISTS `login_attempts`;
DROP TABLE IF EXISTS `user_settings`;
DROP TABLE IF EXISTS `user_stats`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================================
-- TABLA: users
-- ==========================================================
CREATE TABLE `users` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(150) DEFAULT NULL,
    `avatar` VARCHAR(255) DEFAULT 'default.png',
    `bio` TEXT DEFAULT NULL,
    `role` ENUM('user','teacher','admin') DEFAULT 'user',
    `lang` VARCHAR(5) DEFAULT 'es',
    `email_verified` TINYINT(1) DEFAULT 0,
    `two_factor_enabled` TINYINT(1) DEFAULT 0,
    `two_factor_secret` VARCHAR(64) DEFAULT NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    `is_public` TINYINT(1) DEFAULT 1,
    `last_login` DATETIME DEFAULT NULL,
    `last_ip` VARCHAR(45) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_username` (`username`),
    UNIQUE KEY `uq_email` (`email`),
    KEY `idx_role` (`role`),
    KEY `idx_active` (`is_active`),
    KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- TABLA: user_stats (separada para performance)
-- ==========================================================
CREATE TABLE `user_stats` (
    `user_id` INT UNSIGNED NOT NULL,
    `level` INT UNSIGNED DEFAULT 1,
    `xp` INT UNSIGNED DEFAULT 0,
    `total_xp` INT UNSIGNED DEFAULT 0,
    `streak` INT UNSIGNED DEFAULT 0,
    `longest_streak` INT UNSIGNED DEFAULT 0,
    `last_practice_date` DATE DEFAULT NULL,
    `lessons_completed` INT UNSIGNED DEFAULT 0,
    `lessons_perfect` INT UNSIGNED DEFAULT 0,
    `letters_learned` INT UNSIGNED DEFAULT 0,
    `words_learned` INT UNSIGNED DEFAULT 0,
    `detections_total` INT UNSIGNED DEFAULT 0,
    `detections_correct` INT UNSIGNED DEFAULT 0,
    `accuracy` DECIMAL(5,2) DEFAULT 0.00,
    `time_practiced` INT UNSIGNED DEFAULT 0,
    `sessions_count` INT UNSIGNED DEFAULT 0,
    `rank_points` INT UNSIGNED DEFAULT 0,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`user_id`),
    KEY `idx_level` (`level`),
    KEY `idx_total_xp` (`total_xp`),
    KEY `idx_streak` (`streak`),
    KEY `idx_rank` (`rank_points`),
    CONSTRAINT `fk_stats_user` FOREIGN KEY (`user_id`) 
        REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- TABLA: user_settings
-- ==========================================================
CREATE TABLE `user_settings` (
    `user_id` INT UNSIGNED NOT NULL,
    `theme` ENUM('dark','light','auto') DEFAULT 'dark',
    `notifications_email` TINYINT(1) DEFAULT 1,
    `notifications_push` TINYINT(1) DEFAULT 1,
    `notifications_achievements` TINYINT(1) DEFAULT 1,
    `notifications_streak` TINYINT(1) DEFAULT 1,
    `sound_enabled` TINYINT(1) DEFAULT 1,
    `vibration_enabled` TINYINT(1) DEFAULT 1,
    `camera_mirror` TINYINT(1) DEFAULT 1,
    `camera_preferred` VARCHAR(50) DEFAULT 'front',
    `detection_sensitivity` DECIMAL(3,2) DEFAULT 0.75,
    `show_skeleton` TINYINT(1) DEFAULT 1,
    `show_confidence` TINYINT(1) DEFAULT 1,
    `difficulty_preference` ENUM('auto','easy','medium','hard') DEFAULT 'auto',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`user_id`),
    CONSTRAINT `fk_settings_user` FOREIGN KEY (`user_id`) 
        REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- TABLA: login_attempts (anti fuerza bruta)
-- ==========================================================
CREATE TABLE `login_attempts` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `identifier` VARCHAR(150) NOT NULL,
    `ip` VARCHAR(45) NOT NULL,
    `user_agent` VARCHAR(255) DEFAULT NULL,
    `success` TINYINT(1) DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_identifier` (`identifier`),
    KEY `idx_ip` (`ip`),
    KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- TABLA: email_verifications
-- ==========================================================
CREATE TABLE `email_verifications` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INT UNSIGNED NOT NULL,
    `token` VARCHAR(64) NOT NULL,
    `expires_at` DATETIME NOT NULL,
    `used` TINYINT(1) DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_token` (`token`),
    KEY `idx_user` (`user_id`),
    KEY `idx_expires` (`expires_at`),
    CONSTRAINT `fk_emailver_user` FOREIGN KEY (`user_id`) 
        REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- TABLA: password_resets
-- ==========================================================
CREATE TABLE `password_resets` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INT UNSIGNED NOT NULL,
    `token` VARCHAR(64) NOT NULL,
    `ip` VARCHAR(45) DEFAULT NULL,
    `expires_at` DATETIME NOT NULL,
    `used` TINYINT(1) DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_reset_token` (`token`),
    KEY `idx_reset_user` (`user_id`),
    CONSTRAINT `fk_reset_user` FOREIGN KEY (`user_id`) 
        REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- TABLA: user_sessions (sesiones activas)
-- ==========================================================
CREATE TABLE `user_sessions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INT UNSIGNED NOT NULL,
    `session_token` VARCHAR(64) NOT NULL,
    `ip` VARCHAR(45) DEFAULT NULL,
    `user_agent` VARCHAR(255) DEFAULT NULL,
    `device` VARCHAR(100) DEFAULT NULL,
    `last_active` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_session_token` (`session_token`),
    KEY `idx_sess_user` (`user_id`),
    CONSTRAINT `fk_sess_user` FOREIGN KEY (`user_id`) 
        REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- TABLA: letters (abecedario)
-- ==========================================================
CREATE TABLE `letters` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `letter` CHAR(2) NOT NULL,
    `description` TEXT,
    `hint` VARCHAR(255) DEFAULT NULL,
    `difficulty` ENUM('easy','medium','hard') DEFAULT 'easy',
    `category` VARCHAR(50) DEFAULT 'alfabeto',
    `svg_url` VARCHAR(255) DEFAULT NULL,
    `video_url` VARCHAR(255) DEFAULT NULL,
    `points_data` LONGTEXT DEFAULT NULL COMMENT 'Coordenadas normalizadas de ejemplo',
    `fingerpose_data` LONGTEXT DEFAULT NULL COMMENT 'Plantilla Fingerpose JSON',
    `order_index` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_letter` (`letter`),
    KEY `idx_difficulty` (`difficulty`),
    KEY `idx_order` (`order_index`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- TABLA: words
-- ==========================================================
CREATE TABLE `words` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `word` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `category` VARCHAR(50) DEFAULT 'general',
    `description` TEXT,
    `hint` VARCHAR(255) DEFAULT NULL,
    `difficulty` ENUM('easy','medium','hard') DEFAULT 'easy',
    `image_url` VARCHAR(255) DEFAULT NULL,
    `video_url` VARCHAR(255) DEFAULT NULL,
    `points_data` LONGTEXT DEFAULT NULL,
    `fingerpose_data` LONGTEXT DEFAULT NULL,
    `order_index` INT DEFAULT 0,
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_word_slug` (`slug`),
    KEY `idx_category` (`category`),
    KEY `idx_difficulty` (`difficulty`),
    KEY `idx_word` (`word`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- TABLA: lessons
-- ==========================================================
CREATE TABLE `lessons` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(150) NOT NULL,
    `slug` VARCHAR(170) NOT NULL,
    `description` TEXT,
    `long_description` TEXT DEFAULT NULL,
    `level` INT DEFAULT 1,
    `category` VARCHAR(50) DEFAULT 'abecedario',
    `icon` VARCHAR(20) DEFAULT '📘',
    `order_index` INT DEFAULT 0,
    `xp_reward` INT DEFAULT 20,
    `prerequisite_id` INT UNSIGNED DEFAULT NULL COMMENT 'Lección anterior requerida',
    `is_active` TINYINT(1) DEFAULT 1,
    `is_premium` TINYINT(1) DEFAULT 0,
    `created_by` INT UNSIGNED DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_lesson_slug` (`slug`),
    KEY `idx_level` (`level`),
    KEY `idx_category` (`category`),
    KEY `idx_order` (`order_index`),
    KEY `idx_active` (`is_active`),
    KEY `idx_prereq` (`prerequisite_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- TABLA: lesson_items
-- ==========================================================
CREATE TABLE `lesson_items` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `lesson_id` INT UNSIGNED NOT NULL,
    `item_type` ENUM('letter','word','phrase') DEFAULT 'letter',
    `item_value` VARCHAR(100) NOT NULL,
    `item_id_ref` INT UNSIGNED DEFAULT NULL COMMENT 'FK opcional a letters/words',
    `hint` VARCHAR(255) DEFAULT NULL,
    `order_index` INT DEFAULT 0,
    PRIMARY KEY (`id`),
    KEY `idx_lesson` (`lesson_id`),
    KEY `idx_order` (`order_index`),
    CONSTRAINT `fk_item_lesson` FOREIGN KEY (`lesson_id`) 
        REFERENCES `lessons` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- TABLA: user_progress
-- ==========================================================
CREATE TABLE `user_progress` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INT UNSIGNED NOT NULL,
    `lesson_id` INT UNSIGNED NOT NULL,
    `completed` TINYINT(1) DEFAULT 0,
    `score` INT DEFAULT 0,
    `max_score` INT DEFAULT 0,
    `accuracy` DECIMAL(5,2) DEFAULT 0.00,
    `attempts` INT UNSIGNED DEFAULT 0,
    `time_spent` INT UNSIGNED DEFAULT 0,
    `perfect` TINYINT(1) DEFAULT 0,
    `last_attempt` DATETIME DEFAULT NULL,
    `completed_at` DATETIME DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_user_lesson` (`user_id`, `lesson_id`),
    KEY `idx_user` (`user_id`),
    KEY `idx_lesson` (`lesson_id`),
    KEY `idx_completed` (`completed`),
    CONSTRAINT `fk_prog_user` FOREIGN KEY (`user_id`) 
        REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_prog_lesson` FOREIGN KEY (`lesson_id`) 
        REFERENCES `lessons` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Progreso de la ruta interactiva del menú; los eventos se guardan en UTC.
CREATE TABLE `user_curriculum_progress` (
    `user_id` INT UNSIGNED NOT NULL,
    `lesson_key` VARCHAR(16) NOT NULL,
    `lesson_order` SMALLINT UNSIGNED NOT NULL,
    `section_no` TINYINT UNSIGNED NOT NULL,
    `lesson_index` TINYINT UNSIGNED NOT NULL,
    `xp_awarded` INT UNSIGNED NOT NULL DEFAULT 0,
    `timezone` VARCHAR(64) NOT NULL DEFAULT 'America/Mexico_City',
    `completed_at_utc` DATETIME NOT NULL,
    PRIMARY KEY (`user_id`,`lesson_key`),
    UNIQUE KEY `uq_user_curriculum_order` (`user_id`,`lesson_order`),
    KEY `idx_curriculum_completed` (`completed_at_utc`),
    CONSTRAINT `fk_curriculum_progress_user` FOREIGN KEY (`user_id`)
        REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- TABLA: detection_history
-- ==========================================================
CREATE TABLE `detection_history` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INT UNSIGNED DEFAULT NULL,
    `detected_char` VARCHAR(20) DEFAULT NULL,
    `expected_char` VARCHAR(20) DEFAULT NULL,
    `confidence` DECIMAL(5,2) DEFAULT 0.00,
    `is_correct` TINYINT(1) DEFAULT 0,
    `session_type` VARCHAR(50) DEFAULT 'practice',
    `session_id` BIGINT UNSIGNED DEFAULT NULL,
    `lesson_id` INT UNSIGNED DEFAULT NULL,
    `hand_used` ENUM('left','right','both') DEFAULT NULL,
    `processing_time_ms` INT UNSIGNED DEFAULT 0,
    `ip` VARCHAR(45) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_user` (`user_id`),
    KEY `idx_char` (`detected_char`),
    KEY `idx_type` (`session_type`),
    KEY `idx_created` (`created_at`),
    KEY `idx_lesson` (`lesson_id`),
    CONSTRAINT `fk_detect_user` FOREIGN KEY (`user_id`) 
        REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- TABLA: achievements
-- ==========================================================
CREATE TABLE `achievements` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL COMMENT 'Identificador único (ej: first_lesson)',
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT,
    `icon` VARCHAR(20) DEFAULT '🏆',
    `color` VARCHAR(20) DEFAULT '#00f0ff',
    `requirement_type` VARCHAR(50) NOT NULL COMMENT 'lessons, streak, xp, level, etc',
    `requirement_value` INT UNSIGNED DEFAULT 1,
    `xp_reward` INT UNSIGNED DEFAULT 50,
    `is_hidden` TINYINT(1) DEFAULT 0,
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_ach_code` (`code`),
    KEY `idx_type` (`requirement_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- TABLA: user_achievements
-- ==========================================================
CREATE TABLE `user_achievements` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INT UNSIGNED NOT NULL,
    `achievement_id` INT UNSIGNED NOT NULL,
    `progress` INT UNSIGNED DEFAULT 0,
    `unlocked` TINYINT(1) DEFAULT 0,
    `unlocked_at` DATETIME DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_user_ach` (`user_id`, `achievement_id`),
    KEY `idx_user` (`user_id`),
    KEY `idx_unlocked` (`unlocked`),
    CONSTRAINT `fk_uach_user` FOREIGN KEY (`user_id`) 
        REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_uach_ach` FOREIGN KEY (`achievement_id`) 
        REFERENCES `achievements` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- TABLA: notifications
-- ==========================================================
CREATE TABLE `notifications` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INT UNSIGNED NOT NULL,
    `type` ENUM('info','success','warning','error','achievement','system') DEFAULT 'info',
    `title` VARCHAR(150) NOT NULL,
    `message` TEXT,
    `icon` VARCHAR(20) DEFAULT NULL,
    `link` VARCHAR(255) DEFAULT NULL,
    `is_read` TINYINT(1) DEFAULT 0,
    `read_at` DATETIME DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_notif_user` (`user_id`),
    KEY `idx_read` (`is_read`),
    KEY `idx_created` (`created_at`),
    CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) 
        REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- TABLA: chat_sessions (sesiones del simulador)
-- ==========================================================
CREATE TABLE `chat_sessions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INT UNSIGNED NOT NULL,
    `session_name` VARCHAR(150) DEFAULT NULL,
    `scenario` VARCHAR(50) DEFAULT 'greeting',
    `difficulty` ENUM('easy','medium','hard') DEFAULT 'easy',
    `score` INT DEFAULT 0,
    `total_words` INT DEFAULT 0,
    `words_completed` INT DEFAULT 0,
    `accuracy` DECIMAL(5,2) DEFAULT 0.00,
    `time_spent` INT UNSIGNED DEFAULT 0,
    `started_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `finished_at` DATETIME DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_chat_user` (`user_id`),
    KEY `idx_scenario` (`scenario`),
    KEY `idx_started` (`started_at`),
    CONSTRAINT `fk_chat_user` FOREIGN KEY (`user_id`) 
        REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- TABLA: chat_messages
-- ==========================================================
CREATE TABLE `chat_messages` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `session_id` BIGINT UNSIGNED NOT NULL,
    `sender` ENUM('user','ai','system') DEFAULT 'user',
    `content` TEXT,
    `detected_sign` VARCHAR(100) DEFAULT NULL,
    `confidence` DECIMAL(5,2) DEFAULT NULL,
    `is_correct` TINYINT(1) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_msg_session` (`session_id`),
    KEY `idx_sender` (`sender`),
    CONSTRAINT `fk_msg_session` FOREIGN KEY (`session_id`) 
        REFERENCES `chat_sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- TABLA: tournaments (torneos semanales)
-- ==========================================================
CREATE TABLE `tournaments` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(150) NOT NULL,
    `description` TEXT,
    `difficulty` ENUM('easy','medium','hard') DEFAULT 'medium',
    `theme` VARCHAR(50) DEFAULT 'abecedario',
    `starts_at` DATETIME NOT NULL,
    `ends_at` DATETIME NOT NULL,
    `max_participants` INT UNSIGNED DEFAULT 100,
    `prize_xp` INT UNSIGNED DEFAULT 500,
    `prize_badge` VARCHAR(20) DEFAULT '🥇',
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_active` (`is_active`),
    KEY `idx_dates` (`starts_at`, `ends_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- TABLA: tournament_participants
-- ==========================================================
CREATE TABLE `tournament_participants` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tournament_id` INT UNSIGNED NOT NULL,
    `user_id` INT UNSIGNED NOT NULL,
    `score` INT UNSIGNED DEFAULT 0,
    `correct_detections` INT UNSIGNED DEFAULT 0,
    `total_detections` INT UNSIGNED DEFAULT 0,
    `time_spent` INT UNSIGNED DEFAULT 0,
    `rank` INT UNSIGNED DEFAULT NULL,
    `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `finished_at` DATETIME DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_tour_user` (`tournament_id`, `user_id`),
    KEY `idx_tour` (`tournament_id`),
    KEY `idx_user_t` (`user_id`),
    KEY `idx_score` (`score`),
    CONSTRAINT `fk_tp_tour` FOREIGN KEY (`tournament_id`) 
        REFERENCES `tournaments` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_tp_user` FOREIGN KEY (`user_id`) 
        REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- TABLA: daily_challenges
-- ==========================================================
CREATE TABLE `daily_challenges` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `challenge_date` DATE NOT NULL,
    `type` VARCHAR(50) DEFAULT 'mixed',
    `title` VARCHAR(150) NOT NULL,
    `description` TEXT,
    `target_value` INT UNSIGNED DEFAULT 10,
    `xp_reward` INT UNSIGNED DEFAULT 50,
    `content_json` LONGTEXT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_date` (`challenge_date`),
    KEY `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
