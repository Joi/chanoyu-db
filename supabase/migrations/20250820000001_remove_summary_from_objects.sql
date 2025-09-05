-- Deprecate summary fields from objects. Safe to run multiple times.
-- Phase 1: code stops referencing columns; this migration is a no-op placeholder
-- Phase 2 (later): actually drop the columns when confirmed unused.

-- Optional: comment to mark as deprecated
comment on column objects.summary is 'DEPRECATED: use notes instead';
comment on column objects.summary_ja is 'DEPRECATED: use notes_ja instead';

-- For safety, do not drop in this migration. Follow-up migration will drop:
-- alter table objects drop column if exists summary;
-- alter table objects drop column if exists summary_ja;


