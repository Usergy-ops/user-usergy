
-- First, check if foreign key constraints exist and add them if missing
DO $$ 
BEGIN
    -- Add foreign key constraints if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_project_activities_user' AND table_name = 'project_activities'
    ) THEN
        ALTER TABLE project_activities 
        ADD CONSTRAINT fk_project_activities_user 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_conversations_created_by' AND table_name = 'conversations'
    ) THEN
        ALTER TABLE conversations 
        ADD CONSTRAINT fk_conversations_created_by 
        FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_messages_sender' AND table_name = 'messages'
    ) THEN
        ALTER TABLE messages 
        ADD CONSTRAINT fk_messages_sender 
        FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create enum types if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_type_enum') THEN
        CREATE TYPE activity_type_enum AS ENUM ('created', 'updated', 'completed', 'comment', 'file_upload', 'status_change');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_type_enum') THEN
        CREATE TYPE message_type_enum AS ENUM ('text', 'image', 'file', 'system');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type_enum') THEN
        CREATE TYPE notification_type_enum AS ENUM ('message', 'project_update', 'invitation', 'system');
    END IF;
END $$;

-- Update tables to use enum types
ALTER TABLE project_activities 
ALTER COLUMN activity_type TYPE activity_type_enum USING activity_type::activity_type_enum;

ALTER TABLE messages 
ALTER COLUMN message_type TYPE message_type_enum USING message_type::message_type_enum;

-- Update notifications table to use enum type
ALTER TABLE notifications 
ALTER COLUMN type TYPE notification_type_enum USING type::notification_type_enum;

-- Ensure notifications table has proper RLS policy
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Users can manage their own notifications' AND tablename = 'notifications'
    ) THEN
        CREATE POLICY "Users can manage their own notifications" ON notifications
        FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;
