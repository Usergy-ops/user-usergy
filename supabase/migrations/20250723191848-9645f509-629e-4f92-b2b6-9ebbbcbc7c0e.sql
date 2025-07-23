
-- Remove all dashboard-related tables if they exist
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS messages CASCADE; 
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS project_activities CASCADE;
DROP TABLE IF EXISTS project_participants CASCADE;
DROP TABLE IF EXISTS project_invitations CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;

-- Remove custom enum types if they exist
DROP TYPE IF EXISTS activity_type_enum CASCADE;
DROP TYPE IF EXISTS message_type_enum CASCADE;
DROP TYPE IF EXISTS notification_type_enum CASCADE;

-- Remove any dashboard-related functions if they exist
DROP FUNCTION IF EXISTS public.create_project CASCADE;
DROP FUNCTION IF EXISTS public.join_project CASCADE;
DROP FUNCTION IF EXISTS public.send_message CASCADE;
DROP FUNCTION IF EXISTS public.create_notification CASCADE;
DROP FUNCTION IF EXISTS public.log_activity CASCADE;
DROP FUNCTION IF EXISTS public.get_user_projects CASCADE;
DROP FUNCTION IF EXISTS public.get_project_messages CASCADE;

-- Remove any dashboard-related triggers if they exist
DROP TRIGGER IF EXISTS on_project_created ON public.projects;
DROP TRIGGER IF EXISTS on_message_sent ON public.messages;
DROP TRIGGER IF EXISTS on_activity_logged ON public.project_activities;

-- Remove any dashboard-related storage buckets if they exist
DELETE FROM storage.buckets WHERE id IN ('project-files', 'message-attachments', 'activity-uploads');

-- Verify core tables remain intact (this is just for verification, no changes)
-- The following tables should remain:
-- profiles, user_devices, user_otp_verification, user_otps, user_skills, user_social_presence, user_tech_fluency
