import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('Running migration: Add onboarding_completed to profiles table...')
  
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;'
  })

  if (error) {
    // If RPC fails (likely because exec_sql doesn't exist), try another way or just report
    console.error('Migration failed via RPC:', error.message)
    console.log('Please run the following SQL in your Supabase SQL Editor:')
    console.log('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;')
  } else {
    console.log('Migration completed successfully (if exec_sql was available).')
  }
}

runMigration()
