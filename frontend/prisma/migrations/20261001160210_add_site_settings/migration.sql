-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "whatsappNumber" TEXT,
    "phoneNumber" TEXT,
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "tiktokUrl" TEXT,
    "deliveryFee" INTEGER NOT NULL DEFAULT 60,
    "hoursText" TEXT NOT NULL DEFAULT 'Open till 4 AM',
    "openTime" TEXT,
    "closeTime" TEXT,
    "autoSchedule" BOOLEAN NOT NULL DEFAULT false,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "closedMessage" TEXT NOT NULL DEFAULT 'We are closed right now. Please order again later.',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);
