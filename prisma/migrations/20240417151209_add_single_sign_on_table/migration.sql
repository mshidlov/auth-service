-- CreateTable
CREATE TABLE `single_sign_on` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `userId` BIGINT NOT NULL,
    `origin` ENUM('GOOGLE', 'MICROSOFT', 'FACEBOOK', 'TWITTER', 'GITHUB') NOT NULL,
    `originId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `single_sign_on_origin_originId_key`(`origin`, `originId`),
    UNIQUE INDEX `single_sign_on_origin_userId_key`(`origin`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `single_sign_on` ADD CONSTRAINT `single_sign_on_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
