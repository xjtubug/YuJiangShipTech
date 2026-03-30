-- AlterTable
ALTER TABLE `Customer` MODIFY `tags` VARCHAR(2000) NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE `CustomerComment` MODIFY `images` VARCHAR(2000) NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE `EmailCampaign` MODIFY `targetTags` VARCHAR(2000) NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE `Product` MODIFY `specsJson` VARCHAR(5000) NOT NULL DEFAULT '{}',
    MODIFY `images` VARCHAR(2000) NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE `Review` MODIFY `images` VARCHAR(2000) NOT NULL DEFAULT '[]';
