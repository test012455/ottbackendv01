/*
  Warnings:

  - You are about to drop the column `thumbnailPath` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `video1080Path` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `video360Path` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `video480Path` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `video720Path` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `videoPath` on the `Video` table. All the data in the column will be lost.
  - Added the required column `videoOriginalUrl` to the `Video` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Video" DROP COLUMN "thumbnailPath",
DROP COLUMN "video1080Path",
DROP COLUMN "video360Path",
DROP COLUMN "video480Path",
DROP COLUMN "video720Path",
DROP COLUMN "videoPath",
ADD COLUMN     "thumbnailUrl" TEXT,
ADD COLUMN     "video1080Url" TEXT,
ADD COLUMN     "video360Url" TEXT,
ADD COLUMN     "video480Url" TEXT,
ADD COLUMN     "video720Url" TEXT,
ADD COLUMN     "videoOriginalUrl" TEXT NOT NULL;
