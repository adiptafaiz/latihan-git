-- Add profile fields required by the user profile feature.
ALTER TABLE "User"
ADD COLUMN "phone" TEXT,
ADD COLUMN "position" TEXT,
ADD COLUMN "department" TEXT,
ADD COLUMN "address" TEXT,
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- New accounts default to the limited staff role; existing admins keep their role.
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'staff';

CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_status_idx" ON "User"("status");
CREATE INDEX "User_department_idx" ON "User"("department");
