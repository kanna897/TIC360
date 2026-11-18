-- TIC360 reliability migration
-- Run once in the Supabase SQL Editor for an existing database.
-- If creation fails, first review duplicate student_id values in dropouts.

begin;

create unique index if not exists unique_dropouts_student_id
  on public.dropouts (student_id);

-- Authenticated application users may append audit events. RLS policies in
-- supabase_security_hardening.sql still decide which rows are accepted.
grant select, insert on public.audit_logs to authenticated;

commit;
