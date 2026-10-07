-- Open Query Tool with lms_db selected, then run this entire script.
-- Every statement is read-only; no tables or data are changed.
BEGIN TRANSACTION READ ONLY;

SELECT
    current_database() AS database_name,
    current_user AS connected_user,
    inet_server_addr() AS server_address,
    inet_server_port() AS server_port,
    current_setting('server_version') AS server_version;

SELECT
    tablename AS table_name
FROM pg_catalog.pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
      'advocates',
      'clients',
      'cases',
      'payment_ledger',
      'hearing_reminders',
      'alembic_version'
  )
ORDER BY table_name, ordinal_position;

SELECT to_regclass('public.alembic_version') AS alembic_version_table;

SELECT
    extname AS installed_extension
FROM pg_catalog.pg_extension
WHERE extname = 'uuid-ossp';

ROLLBACK;

-- If alembic_version_table above is not NULL, optionally run this separate read-only query:
-- SELECT version_num FROM public.alembic_version;
