
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://tyttayztezkwwsejdfyb.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5dHRheXp0ZXprd3dzZWpkZnliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMDg3MDYsImV4cCI6MjA2ODg4NDcwNn0.CowJJP-g7zmlIU37B9nR8nETRvj_3AAizYRpRYX0SJ8"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
