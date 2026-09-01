-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."CampaignObjective" AS ENUM ('AWARENESS', 'ENGAGEMENT', 'CONVERSIONS');

-- CreateEnum
CREATE TYPE "public"."CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."Platform" AS ENUM ('INSTAGRAM', 'FACEBOOK', 'YOUTUBE');

-- CreateEnum
CREATE TYPE "public"."ReelStatus" AS ENUM ('DRAFT', 'PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."AssetType" AS ENUM ('IMAGE', 'VIDEO', 'SCREENSHOT', 'QR_MOCKUP', 'AUDIO');

-- CreateEnum
CREATE TYPE "public"."PostStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."Plan" AS ENUM ('FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "avatar" TEXT,
    "role" "public"."Role" NOT NULL DEFAULT 'USER',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."otps" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."campaigns" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "objective" "public"."CampaignObjective" NOT NULL DEFAULT 'AWARENESS',
    "platforms" TEXT[],
    "status" "public"."CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "budget" DOUBLE PRECISION,
    "spent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "targetAudience" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ad_copies" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "platform" "public"."Platform" NOT NULL,
    "headline" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "cta" TEXT NOT NULL,
    "hashtags" TEXT[],
    "variations" JSONB,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_copies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reels" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "script" TEXT NOT NULL,
    "voice" TEXT NOT NULL DEFAULT 'en-US-JennyNeural',
    "bgStyle" TEXT NOT NULL DEFAULT 'gradient',
    "bgValue" TEXT,
    "captionStyle" JSONB,
    "duration" INTEGER NOT NULL DEFAULT 15,
    "videoUrl" TEXT,
    "thumbnailUrl" TEXT,
    "status" "public"."ReelStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."assets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."AssetType" NOT NULL,
    "url" TEXT NOT NULL,
    "platform" "public"."Platform",
    "tags" TEXT[],
    "size" INTEGER NOT NULL,
    "dimensions" TEXT,
    "mimeType" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."campaign_assets" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."scheduled_posts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "campaignId" TEXT,
    "platform" "public"."Platform" NOT NULL,
    "content" TEXT NOT NULL,
    "mediaUrls" TEXT[],
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "public"."PostStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "engagement" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."campaign_analytics" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "platform" "public"."Platform" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "leads" INTEGER NOT NULL DEFAULT 0,
    "spend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "engagements" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cpl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."platform_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "public"."Platform" NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "profileUrl" TEXT,
    "followerCount" INTEGER NOT NULL DEFAULT 0,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "razorpaySignature" TEXT,
    "plan" "public"."Plan" NOT NULL DEFAULT 'FREE',
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "public"."SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productName" TEXT NOT NULL DEFAULT 'NHY-QR Digital Menu',
    "productTagline" TEXT NOT NULL DEFAULT 'QR-powered digital menus for modern restaurants',
    "productDescription" TEXT,
    "features" JSONB,
    "pricingTiers" JSONB,
    "targetAudience" TEXT[],
    "uvp" TEXT,
    "brandPrimary" TEXT NOT NULL DEFAULT '#C4814B',
    "brandSecondary" TEXT NOT NULL DEFAULT '#2C2420',
    "brandAccent" TEXT NOT NULL DEFAULT '#4A7FB5',
    "headingFont" TEXT NOT NULL DEFAULT 'Inter',
    "bodyFont" TEXT NOT NULL DEFAULT 'Inter',
    "brandVoice" JSONB,
    "forbiddenWords" TEXT[],
    "aiObjective" "public"."CampaignObjective" NOT NULL DEFAULT 'AWARENESS',
    "aiPlatforms" TEXT[],
    "aiCreativity" INTEGER NOT NULL DEFAULT 50,
    "aiHashtagCount" INTEGER NOT NULL DEFAULT 8,
    "aiInclude" TEXT,
    "aiAvoid" TEXT,
    "aiEmojiEnabled" BOOLEAN NOT NULL DEFAULT true,
    "aiCopyLength" TEXT NOT NULL DEFAULT 'medium',
    "aiCTA" TEXT NOT NULL DEFAULT 'Learn More',
    "aiLanguage" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "public"."users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "otps_phone_idx" ON "public"."otps"("phone");

-- CreateIndex
CREATE INDEX "campaigns_userId_idx" ON "public"."campaigns"("userId");

-- CreateIndex
CREATE INDEX "ad_copies_campaignId_idx" ON "public"."ad_copies"("campaignId");

-- CreateIndex
CREATE INDEX "reels_userId_idx" ON "public"."reels"("userId");

-- CreateIndex
CREATE INDEX "assets_userId_idx" ON "public"."assets"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_assets_campaignId_assetId_key" ON "public"."campaign_assets"("campaignId", "assetId");

-- CreateIndex
CREATE INDEX "scheduled_posts_userId_idx" ON "public"."scheduled_posts"("userId");

-- CreateIndex
CREATE INDEX "scheduled_posts_scheduledAt_idx" ON "public"."scheduled_posts"("scheduledAt");

-- CreateIndex
CREATE INDEX "campaign_analytics_campaignId_idx" ON "public"."campaign_analytics"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_analytics_campaignId_platform_date_key" ON "public"."campaign_analytics"("campaignId", "platform", "date");

-- CreateIndex
CREATE INDEX "platform_accounts_userId_idx" ON "public"."platform_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "platform_accounts_userId_platform_accountId_key" ON "public"."platform_accounts"("userId", "platform", "accountId");

-- CreateIndex
CREATE INDEX "subscriptions_userId_idx" ON "public"."subscriptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_userId_key" ON "public"."user_settings"("userId");

-- AddForeignKey
ALTER TABLE "public"."campaigns" ADD CONSTRAINT "campaigns_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ad_copies" ADD CONSTRAINT "ad_copies_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reels" ADD CONSTRAINT "reels_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."assets" ADD CONSTRAINT "assets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."campaign_assets" ADD CONSTRAINT "campaign_assets_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."campaign_assets" ADD CONSTRAINT "campaign_assets_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "public"."assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."scheduled_posts" ADD CONSTRAINT "scheduled_posts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."scheduled_posts" ADD CONSTRAINT "scheduled_posts_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."campaign_analytics" ADD CONSTRAINT "campaign_analytics_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."platform_accounts" ADD CONSTRAINT "platform_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;