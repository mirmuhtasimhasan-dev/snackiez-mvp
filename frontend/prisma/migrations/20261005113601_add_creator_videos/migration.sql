-- CreateTable
CREATE TABLE "CreatorVideo" (
    "id" TEXT NOT NULL,
    "creatorName" TEXT NOT NULL,
    "handle" TEXT,
    "instagramUrl" TEXT,
    "videoUrl" TEXT NOT NULL,
    "posterUrl" TEXT,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreatorVideo_pkey" PRIMARY KEY ("id")
);

