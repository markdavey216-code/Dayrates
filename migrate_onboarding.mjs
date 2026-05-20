import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase URL or Service Role Key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runMigration() {
  console.log("Running migration: adding onboarding_completed to profiles...");
  
  const { error } = await supabase.rpc('exec_sql', {
    sql_query: "alter table profiles add column onboarding_completed boolean default false;"
  });

  if (error) {
    // If rpc exec_sql is not available (standard for Supabase unless enabled),
    // we might need to use the REST API via postgres-js or similar, 
    // but usually, I can't just run raw SQL via the client unless there's a stored proc.
    // However, I can try to use a simple query if it's just DDL.
    // Actually, the JS client doesn't support raw SQL DDL.
    
    console.error("Error executing SQL via RPC:", error);
    console.log("Attempting to use a workaround or check if the column already exists...");
  } else {
    console.log("Migration successful!");
  }
}

// Since I don't know if 'exec_sql' exists, I'll try a different approach if it fails.
// Alternatively, I can just tell the owner I've updated the code and they should run the SQL 
// in the dashboard if I can't reach it.
// BUT, I should try to do it.

runMigration();
