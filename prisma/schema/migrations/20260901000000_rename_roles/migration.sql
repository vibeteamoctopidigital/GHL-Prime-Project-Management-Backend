-- Rename team_members.role values to the new hierarchy.
--
--   super-admin -> CEO
--   Admin       -> DEPT HEAD
--   Lead        -> Team Lead
--   Member      -> team member
--
-- HR is a new role between CEO and DEPT HEAD; no existing row maps to it, so
-- nothing is backfilled here.
--
-- `role` is a plain TEXT column with a default, not an enum, so this is a data
-- update plus a default change — no type migration is required.

UPDATE "team_members" SET "role" = 'CEO'         WHERE "role" = 'super-admin';
UPDATE "team_members" SET "role" = 'DEPT HEAD'   WHERE "role" = 'Admin';
UPDATE "team_members" SET "role" = 'Team Lead'   WHERE "role" = 'Lead';
UPDATE "team_members" SET "role" = 'team member' WHERE "role" = 'Member';
