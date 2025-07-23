
-- Drop all dashboard-related tables in reverse dependency order
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS messages CASCADE; 
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS project_activities CASCADE;
DROP TABLE IF EXISTS project_participants CASCADE;
DROP TABLE IF EXISTS project_invitations CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;

-- Drop enum types that were created
DROP TYPE IF EXISTS activity_type_enum CASCADE;
DROP TYPE IF EXISTS message_type_enum CASCADE;
DROP TYPE IF EXISTS notification_type_enum CASCADE;
