
-- Check the current foreign key constraints on user_devices table
SELECT
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='user_devices';

-- Drop the foreign key constraint on user_devices that's causing the issue
-- The user_devices table should reference auth.users directly, not through profiles
ALTER TABLE public.user_devices 
DROP CONSTRAINT IF EXISTS user_devices_user_id_fkey;

-- Add the correct foreign key constraint that references auth.users
ALTER TABLE public.user_devices 
ADD CONSTRAINT user_devices_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Do the same for other user tables to ensure consistency
ALTER TABLE public.user_tech_fluency 
DROP CONSTRAINT IF EXISTS user_tech_fluency_user_id_fkey;

ALTER TABLE public.user_tech_fluency 
ADD CONSTRAINT user_tech_fluency_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_skills 
DROP CONSTRAINT IF EXISTS user_skills_user_id_fkey;

ALTER TABLE public.user_skills 
ADD CONSTRAINT user_skills_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.consolidated_social_presence 
DROP CONSTRAINT IF EXISTS consolidated_social_presence_user_id_fkey;

ALTER TABLE public.consolidated_social_presence 
ADD CONSTRAINT consolidated_social_presence_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
