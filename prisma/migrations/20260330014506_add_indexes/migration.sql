-- CreateIndex
CREATE INDEX `EmailLog_campaignId_idx` ON `EmailLog`(`campaignId`);

-- CreateIndex
CREATE INDEX `EmailLog_sentAt_idx` ON `EmailLog`(`sentAt`);

-- CreateIndex
CREATE INDEX `Inquiry_status_idx` ON `Inquiry`(`status`);

-- CreateIndex
CREATE INDEX `Inquiry_createdAt_idx` ON `Inquiry`(`createdAt`);

-- CreateIndex
CREATE INDEX `MediaFile_category_idx` ON `MediaFile`(`category`);

-- CreateIndex
CREATE INDEX `MediaFile_createdAt_idx` ON `MediaFile`(`createdAt`);

-- CreateIndex
CREATE INDEX `Notification_read_createdAt_idx` ON `Notification`(`read`, `createdAt`);

-- CreateIndex
CREATE INDEX `Order_status_idx` ON `Order`(`status`);

-- CreateIndex
CREATE INDEX `Order_createdAt_idx` ON `Order`(`createdAt`);

-- CreateIndex
CREATE INDEX `PageView_createdAt_idx` ON `PageView`(`createdAt`);

-- CreateIndex
CREATE INDEX `Product_status_published_idx` ON `Product`(`status`, `published`);

-- CreateIndex
CREATE INDEX `Product_featured_idx` ON `Product`(`featured`);

-- CreateIndex
CREATE INDEX `Quotation_status_idx` ON `Quotation`(`status`);

-- CreateIndex
CREATE INDEX `Quotation_createdAt_idx` ON `Quotation`(`createdAt`);

-- CreateIndex
CREATE INDEX `Visitor_ip_idx` ON `Visitor`(`ip`);

-- CreateIndex
CREATE INDEX `Visitor_leadScore_idx` ON `Visitor`(`leadScore`);

-- CreateIndex
CREATE INDEX `Visitor_isHighValue_idx` ON `Visitor`(`isHighValue`);

-- RenameIndex
ALTER TABLE `Inquiry` RENAME INDEX `Inquiry_customerId_fkey` TO `Inquiry_customerId_idx`;

-- RenameIndex
ALTER TABLE `Order` RENAME INDEX `Order_customerId_fkey` TO `Order_customerId_idx`;

-- RenameIndex
ALTER TABLE `PageView` RENAME INDEX `PageView_productId_fkey` TO `PageView_productId_idx`;

-- RenameIndex
ALTER TABLE `PageView` RENAME INDEX `PageView_visitorId_fkey` TO `PageView_visitorId_idx`;

-- RenameIndex
ALTER TABLE `Product` RENAME INDEX `Product_categoryId_fkey` TO `Product_categoryId_idx`;

-- RenameIndex
ALTER TABLE `Quotation` RENAME INDEX `Quotation_customerId_fkey` TO `Quotation_customerId_idx`;
