-- CreateTable
CREATE TABLE `vocabularies` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `kanji` VARCHAR(255) NOT NULL,
    `hiragana` VARCHAR(255) NULL,
    `romaji` VARCHAR(255) NULL,
    `meaning_vi` VARCHAR(1000) NOT NULL,
    `on_yomi` VARCHAR(255) NULL,
    `level` VARCHAR(20) NOT NULL DEFAULT 'N5',
    `media_url` VARCHAR(500) NULL,
    `note` TEXT NULL,
    `tags` JSON NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'draft',
    `created_by_id` INTEGER UNSIGNED NOT NULL,
    `updated_by_id` INTEGER UNSIGNED NULL,
    `version` INTEGER UNSIGNED NOT NULL DEFAULT 1,
    `learn_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `favorite_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `report_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `vocabularies_kanji_idx`(`kanji`),
    INDEX `vocabularies_level_idx`(`level`),
    INDEX `vocabularies_status_idx`(`status`),
    INDEX `vocabularies_created_by_id_idx`(`created_by_id`),
    INDEX `vocabularies_updated_by_id_idx`(`updated_by_id`),
    INDEX `vocabularies_is_deleted_idx`(`is_deleted`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `vocabularies` ADD CONSTRAINT `vocabularies_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vocabularies` ADD CONSTRAINT `vocabularies_updated_by_id_fkey` FOREIGN KEY (`updated_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
