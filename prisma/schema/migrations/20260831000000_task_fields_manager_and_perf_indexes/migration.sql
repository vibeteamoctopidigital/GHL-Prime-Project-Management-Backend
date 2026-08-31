-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "category" TEXT,
ADD COLUMN     "estimated_time" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "team_members" ADD COLUMN     "managed_by_id" UUID;

-- CreateIndex
CREATE INDEX "task_assignments_member_id_status_idx" ON "task_assignments"("member_id", "status");

-- CreateIndex
CREATE INDEX "tasks_project_id_status_idx" ON "tasks"("project_id", "status");

-- CreateIndex
CREATE INDEX "team_members_managed_by_id_idx" ON "team_members"("managed_by_id");

-- CreateIndex
CREATE INDEX "time_logs_task_id_log_date_idx" ON "time_logs"("task_id", "log_date");

-- CreateIndex
CREATE INDEX "time_logs_member_id_log_date_idx" ON "time_logs"("member_id", "log_date");

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_managed_by_id_fkey" FOREIGN KEY ("managed_by_id") REFERENCES "team_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

