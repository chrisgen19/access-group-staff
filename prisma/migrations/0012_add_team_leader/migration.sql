-- AlterTable
ALTER TABLE "sub_departments" ADD COLUMN     "team_leader_id" TEXT;

-- CreateIndex
CREATE INDEX "sub_departments_team_leader_id_idx" ON "sub_departments"("team_leader_id");

-- AddForeignKey
ALTER TABLE "sub_departments" ADD CONSTRAINT "sub_departments_team_leader_id_fkey" FOREIGN KEY ("team_leader_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
