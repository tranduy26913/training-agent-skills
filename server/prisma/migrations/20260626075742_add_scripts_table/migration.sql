-- CreateTable
CREATE TABLE `scripts` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(200) NOT NULL,
    `idea` TEXT NOT NULL,
    `character_count` INTEGER UNSIGNED NOT NULL,
    `min_scenes` INTEGER UNSIGNED NOT NULL,
    `vibe` JSON NOT NULL,
    `content` TEXT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'draft',
    `project_id` INTEGER UNSIGNED NOT NULL,
    `owner_id` INTEGER UNSIGNED NOT NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `scripts_project_id_idx`(`project_id`),
    INDEX `scripts_owner_id_idx`(`owner_id`),
    INDEX `scripts_is_deleted_idx`(`is_deleted`),
    INDEX `scripts_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `scripts` ADD CONSTRAINT `scripts_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `scripts` ADD CONSTRAINT `scripts_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
